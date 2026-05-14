import type { Message, LLMModel, ProviderConfig, ProviderId } from '../types';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ── Cache helpers ──

interface ModelCache {
    models: LLMModel[];
    fetchedAt: number;
}

function cacheKey(providerId: ProviderId, user: string): string {
    return `modelCache_${providerId}_${user}`;
}

function readCache(providerId: ProviderId, user: string): ModelCache | null {
    try {
        const raw = localStorage.getItem(cacheKey(providerId, user));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function writeCache(providerId: ProviderId, user: string, models: LLMModel[]): void {
    const entry: ModelCache = { models, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(providerId, user), JSON.stringify(entry));
}

function isCacheValid(cache: ModelCache | null): boolean {
    return cache !== null && (Date.now() - cache.fetchedAt) < CACHE_TTL_MS;
}

// ── Provider-specific model fetching & filtering ──

/** OpenRouter already returns chat-only models in `{ data: [...] }` with `name` field */
async function fetchOpenRouterModels(apiKey: string, baseUrl: string): Promise<LLMModel[]> {
    const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const models = data.data;
    if (!Array.isArray(models) || models.length === 0) return [];

    return models.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        name: (m.name as string) || (m.id as string),
        context_length: m.context_length as number | undefined,
        pricing: m.pricing as { prompt: string; completion: string } | undefined,
    }));
}

/**
 * OpenAI returns ALL model types in `{ data: [...] }`.
 * Filter by ID prefix to keep only chat-compatible models.
 */
const OPENAI_CHAT_PREFIXES = ['gpt-5', 'gpt-4', 'o1', 'o3', 'o4', 'chatgpt-4o'];
const OPENAI_EXCLUSIONS = ['audio', 'realtime', 'vision-preview', 'search'];

async function fetchOpenAIModels(apiKey: string, baseUrl: string): Promise<LLMModel[]> {
    const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const models = data.data;
    if (!Array.isArray(models) || models.length === 0) return [];

    return models
        .filter((m: Record<string, unknown>) => {
            const id = (m.id as string).toLowerCase();
            const isChat = OPENAI_CHAT_PREFIXES.some(p => id.startsWith(p));
            const isNotSpecialized = !OPENAI_EXCLUSIONS.some(e => id.includes(e));
            return isChat && isNotSpecialized;
        })
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            (b.created as number ?? 0) - (a.created as number ?? 0)
        )
        .map((m: Record<string, unknown>) => ({
            id: m.id as string,
            name: (m.id as string), // OpenAI models don't have a display name
        }));
}

/**
 * Google returns `{ models: [...] }` via native endpoint with `?key=` auth.
 * Filter by `supportedGenerationMethods.includes('generateContent')`.
 */
async function fetchGoogleModels(apiKey: string): Promise<LLMModel[]> {
    // Google's native list endpoint (not the OpenAI-compat one)
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const models = data.models;
    if (!Array.isArray(models) || models.length === 0) return [];

    return models
        .filter((m: Record<string, unknown>) => {
            const methods = m.supportedGenerationMethods as string[] | undefined;
            if (!methods?.includes('generateContent')) return false;
            const name = m.name as string;
            // Exclude non-text-output models (embeddings, AQA, image gen, TTS, audio variants)
            return !name.includes('embedding')
                && !name.includes('aqa')
                && !name.includes('imagen')
                && !name.includes('tts')
                && !name.includes('audio')
                && !name.includes('image-generation');
        })
        .map((m: Record<string, unknown>) => {
            const rawName = m.name as string;
            // Google returns "models/gemini-2.5-flash" — strip the "models/" prefix for use as model ID
            const id = rawName.startsWith('models/') ? rawName.slice(7) : rawName;
            return {
                id,
                name: (m.displayName as string) || id,
                description: m.description as string | undefined,
            };
        });
}

// ── Public API ──

/**
 * Fetches available chat models for the given provider.
 * Uses a 2-hour localStorage cache. Falls back to stale cache or defaultModel.
 */
export async function fetchModels(
    provider: ProviderConfig,
    apiKey: string,
    user: string = '',
): Promise<LLMModel[]> {
    // No key → return just the default
    if (!apiKey) {
        return [provider.defaultModel];
    }

    // Check cache
    const cached = readCache(provider.id, user);
    if (isCacheValid(cached)) {
        return cached!.models;
    }

    try {
        let models: LLMModel[];

        switch (provider.id) {
            case 'openrouter':
                models = await fetchOpenRouterModels(apiKey, provider.baseUrl);
                break;
            case 'openai':
                models = await fetchOpenAIModels(apiKey, provider.baseUrl);
                break;
            case 'google':
                models = await fetchGoogleModels(apiKey);
                break;
            default:
                models = [];
        }

        if (models.length === 0) {
            return cached?.models ?? [provider.defaultModel];
        }

        writeCache(provider.id, user, models);
        return models;
    } catch (error) {
        console.error(`Error fetching models from ${provider.name}:`, error);
        // Stale cache is better than nothing
        return cached?.models ?? [provider.defaultModel];
    }
}

/**
 * Sends a chat completion request via the server-side AI SDK proxy.
 * The server streams text back; we collect all chunks and return the full string.
 * If `onChunk` is provided, it is called with the accumulated text after each chunk.
 */
export interface ChatTools {
    tavily?: { apiKey: string };
}

export interface PhoenixHeaders {
    endpoint: string;
    apiKey?: string;
    project?: string;
}

export async function chatCompletion(
    provider: ProviderConfig,
    apiKey: string,
    modelId: string,
    messages: Message[],
    onChunk?: (accumulatedText: string) => void,
    tools?: ChatTools,
    signal?: AbortSignal,
    phoenix?: PhoenixHeaders,
): Promise<string> {
    if (!apiKey) {
        throw new Error(`API Key is missing. Please add your ${provider.name} API Key in settings.`);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (phoenix?.endpoint) {
        headers['X-Phoenix-Endpoint'] = phoenix.endpoint;
        if (phoenix.apiKey) headers['X-Phoenix-Api-Key'] = phoenix.apiKey;
        if (phoenix.project) headers['X-Phoenix-Project'] = phoenix.project;
    }

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            provider: provider.id,
            apiKey,
            model: modelId,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            ...(tools ? { tools } : {}),
        }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `API Error: ${response.statusText}`);
    }

    // Read the text stream and collect all chunks
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let text = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        onChunk?.(text);
    }

    return text;
}
