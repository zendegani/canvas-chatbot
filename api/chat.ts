// MUST come first: sets up the OTel module-load order before `ai` is imported.
import { flushTraces, getTracerFor, resolvePhoenixConfig } from './_lib/instrumentation';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Node runtime (default). Edge runtime is incompatible with the OpenTelemetry
// Node SDK we use for Phoenix tracing — see api/_lib/instrumentation.ts.
//
// We use the legacy (req, res) Vercel function signature rather than Web
// Standard (Request → Response). `vercel dev` reliably parses bodies and
// streams responses with this form; the Web form hangs on body read.

type ProviderId = 'openrouter' | 'openai' | 'google' | 'minimax';

interface ChatRequest {
    provider: ProviderId;
    apiKey: string;
    model: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    tools?: {
        tavily?: { apiKey: string };
    };
}

const TAVILY_MAX_STEPS = 5;

function createModel(provider: ProviderId, apiKey: string, modelId: string, extras?: { minimaxGroupId?: string }) {
    switch (provider) {
        case 'openrouter': {
            const or = createOpenRouter({ apiKey });
            return or.chat(modelId);
        }
        case 'openai': {
            const oai = createOpenAI({ apiKey });
            return oai(modelId);
        }
        case 'google': {
            const google = createGoogleGenerativeAI({ apiKey });
            return google(modelId);
        }
        case 'minimax': {
            // MiniMax's native endpoint speaks the same JSON shape as OpenAI's chat
            // completions, but lives at /v1/text/chatcompletion_v2 and requires
            // GroupId as a query param. We reuse the OpenAI provider and rewrite
            // the URL via a custom fetch.
            //
            // We call `mm.chat(modelId)` (not `mm(modelId)`) because v6's default
            // routes to the new /responses endpoint, which MiniMax doesn't have.
            const groupId = extras?.minimaxGroupId ?? process.env.MINIMAX_GROUP_ID ?? '';
            const wrappedFetch: typeof fetch = (input, init) => {
                let url = typeof input === 'string'
                    ? input
                    : input instanceof URL ? input.toString() : input.url;
                url = url.replace('/v1/chat/completions', '/v1/text/chatcompletion_v2');
                if (groupId) {
                    url += (url.includes('?') ? '&' : '?') + `GroupId=${encodeURIComponent(groupId)}`;
                }
                console.log('[chat:minimax] →', url);
                return fetch(url, init);
            };
            const mm = createOpenAI({
                apiKey,
                baseURL: 'https://api.minimax.io/v1',
                fetch: wrappedFetch,
            });
            return mm.chat(modelId);
        }
    }
}

function buildTavilyTool(tavilyKey: string) {
    return tool({
        description:
            'Search the web for current, factual information. Use when the user asks about recent events, ' +
            'specific facts you may not know, or anything that benefits from up-to-date sources.',
        inputSchema: z.object({
            query: z.string().describe('The search query.'),
            max_results: z.number().int().min(1).max(10).optional().describe('How many results to return. Default 5.'),
        }),
        execute: async ({ query, max_results = 5 }) => {
            const res = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: tavilyKey,
                    query,
                    max_results,
                    search_depth: 'basic',
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                return { error: `Tavily error ${res.status}: ${text || res.statusText}` };
            }
            const data = await res.json() as {
                results?: Array<{ title: string; url: string; content: string }>;
                answer?: string;
            };
            return {
                answer: data.answer,
                results: (data.results ?? []).map(r => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                })),
            };
        },
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    console.log('[chat] →', req.method, req.url);

    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    // Vercel auto-parses JSON bodies for Node functions when Content-Type is application/json.
    const body = req.body as ChatRequest | undefined;
    if (!body || typeof body !== 'object') {
        res.status(400).send('Invalid or missing JSON body');
        return;
    }

    const { provider, apiKey, model, messages, tools: requestedTools } = body;
    console.log('[chat] body', { provider, model, msgCount: messages?.length, hasTools: !!requestedTools });

    if (!provider || !apiKey || !model || !Array.isArray(messages)) {
        res.status(400).send('Missing required fields: provider, apiKey, model, messages');
        return;
    }

    if (!['openrouter', 'openai', 'google', 'minimax'].includes(provider)) {
        res.status(400).send(`Unknown provider: ${provider}`);
        return;
    }

    const tavilyKey = requestedTools?.tavily?.apiKey;
    const useTools = typeof tavilyKey === 'string' && tavilyKey.length > 0;

    // Propagate client disconnects to the LLM call.
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    // Phoenix tracing — headers from client win, env vars are the fallback.
    const phoenixConfig = resolvePhoenixConfig({
        endpoint: firstHeader(req.headers['x-phoenix-endpoint']),
        apiKey: firstHeader(req.headers['x-phoenix-api-key']),
        project: firstHeader(req.headers['x-phoenix-project']),
    });

    const minimaxGroupId = firstHeader(req.headers['x-minimax-group-id']);

    try {
        console.log('[chat] creating model & streamText…');
        const aiModel = createModel(provider, apiKey, model, { minimaxGroupId });

        const logError = ({ error }: { error: unknown }) => {
            if ((error as { name?: string })?.name === 'AbortError') return;
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[chat:${provider}/${model}]`, msg);
        };

        const telemetry = phoenixConfig
            ? {
                isEnabled: true,
                tracer: getTracerFor(phoenixConfig),
                functionId: `chat.${provider}`,
                metadata: { provider, model },
            }
            : { isEnabled: false };

        const result = useTools
            ? streamText({
                model: aiModel,
                messages,
                tools: { tavilySearch: buildTavilyTool(tavilyKey!) },
                stopWhen: stepCountIs(TAVILY_MAX_STEPS),
                abortSignal: controller.signal,
                onError: logError,
                experimental_telemetry: telemetry,
            })
            : streamText({
                model: aiModel,
                messages,
                abortSignal: controller.signal,
                onError: logError,
                experimental_telemetry: telemetry,
            });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.status(200);
        res.flushHeaders?.();

        console.log('[chat] streaming…');
        for await (const chunk of result.textStream) {
            res.write(chunk);
        }
        console.log('[chat] stream done');
        await flushTraces(phoenixConfig);
        res.end();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[chat] sync error:', message);
        await flushTraces(phoenixConfig);
        if (!res.headersSent) {
            res.status(502).send(message);
        } else {
            res.end();
        }
    }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}
