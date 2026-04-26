import { streamText } from 'ai';
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
}

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

    const { provider, apiKey, model, messages } = body;
    if (!provider || !apiKey || !model || !Array.isArray(messages)) {
        return new Response('Missing required fields: provider, apiKey, model, messages', { status: 400 });
    }

    if (!['openrouter', 'openai', 'google'].includes(provider)) {
        return new Response(`Unknown provider: ${provider}`, { status: 400 });
    }

    try {
        const aiModel = createModel(provider, apiKey, model);
        const result = streamText({ model: aiModel, messages });
        return result.toTextStreamResponse();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(message, { status: 502 });
    }
}
