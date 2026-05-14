// MUST come first: registers OTel tracing before `ai` is imported.
import './_lib/instrumentation';

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

type ProviderId = 'openrouter' | 'openai' | 'google';

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

function createModel(provider: ProviderId, apiKey: string, modelId: string) {
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

    if (!['openrouter', 'openai', 'google'].includes(provider)) {
        res.status(400).send(`Unknown provider: ${provider}`);
        return;
    }

    const tavilyKey = requestedTools?.tavily?.apiKey;
    const useTools = typeof tavilyKey === 'string' && tavilyKey.length > 0;

    // Propagate client disconnects to the LLM call.
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
        console.log('[chat] creating model & streamText…');
        const aiModel = createModel(provider, apiKey, model);

        const logError = ({ error }: { error: unknown }) => {
            if ((error as { name?: string })?.name === 'AbortError') return;
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[chat:${provider}/${model}]`, msg);
        };

        const telemetry = {
            isEnabled: !!process.env.PHOENIX_COLLECTOR_ENDPOINT,
            functionId: `chat.${provider}`,
            metadata: { provider, model },
        };

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
        res.end();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[chat] sync error:', message);
        if (!res.headersSent) {
            res.status(502).send(message);
        } else {
            res.end();
        }
    }
}
