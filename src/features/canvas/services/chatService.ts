import type { Message, LLMModel, ProviderConfig } from '../types';

/**
 * Fetches available models from a provider's API.
 * Falls back to the provider's default model if no endpoint or no key.
 */
export async function fetchModels(
    provider: ProviderConfig,
    apiKey: string,
): Promise<LLMModel[]> {
    if (!apiKey || !provider.modelsEndpoint) {
        return [provider.defaultModel];
    }

    try {
        const response = await fetch(`${provider.baseUrl}${provider.modelsEndpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            console.error(`${provider.name} API Error: ${response.status} ${response.statusText}`);
            return [provider.defaultModel];
        }

        const data = await response.json();

        // OpenRouter and OpenAI both return { data: [...] }
        const rawModels = data.data;
        if (!Array.isArray(rawModels) || rawModels.length === 0) {
            return [provider.defaultModel];
        }

        return rawModels.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            name: (m.name as string) || (m.id as string),
            context_length: m.context_length as number | undefined,
            pricing: m.pricing as { prompt: string; completion: string } | undefined,
        }));
    } catch (error) {
        console.error(`Error fetching models from ${provider.name}:`, error);
        return [provider.defaultModel];
    }
}

/**
 * Sends a chat completion request using the OpenAI-compatible format.
 * Works with OpenRouter, OpenAI, and Google AI (via compatibility layer).
 */
export async function chatCompletion(
    provider: ProviderConfig,
    apiKey: string,
    modelId: string,
    messages: Message[],
): Promise<string> {
    if (!apiKey) {
        throw new Error(`API Key is missing. Please add your ${provider.name} API Key in settings.`);
    }

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    // OpenRouter requires these extra headers
    if (provider.id === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Canvas AI';
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: modelId,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            (errorData as { error?: { message?: string } }).error?.message
            || `API Error: ${response.statusText}`
        );
    }

    const data = await response.json();
    return (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || '';
}
