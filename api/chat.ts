import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const config = { runtime: 'edge' };

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

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    let body: ChatRequest;
    try {
        body = await req.json();
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    const { provider, apiKey, model, messages, tools: requestedTools } = body;
    if (!provider || !apiKey || !model || !Array.isArray(messages)) {
        return new Response('Missing required fields: provider, apiKey, model, messages', { status: 400 });
    }

    if (!['openrouter', 'openai', 'google'].includes(provider)) {
        return new Response(`Unknown provider: ${provider}`, { status: 400 });
    }

    const tavilyKey = requestedTools?.tavily?.apiKey;
    const useTools = typeof tavilyKey === 'string' && tavilyKey.length > 0;

    try {
        const aiModel = createModel(provider, apiKey, model);
        const result = useTools
            ? streamText({
                model: aiModel,
                messages,
                tools: { tavilySearch: buildTavilyTool(tavilyKey!) },
                stopWhen: stepCountIs(TAVILY_MAX_STEPS),
                abortSignal: req.signal,
            })
            : streamText({ model: aiModel, messages, abortSignal: req.signal });

        // Wrap textStream to surface mid-stream errors (rate-limit, credit, etc.)
        // back to the client as visible text instead of silently closing the body.
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                try {
                    for await (const chunk of result.textStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                } catch (err: unknown) {
                    if ((err as { name?: string })?.name === 'AbortError') {
                        // Client aborted — don't write an error message.
                    } else {
                        const msg = err instanceof Error ? err.message : 'Unknown error';
                        controller.enqueue(encoder.encode(`\n\n**⚠️ Error:** ${msg}`));
                    }
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(message, { status: 502 });
    }
}
