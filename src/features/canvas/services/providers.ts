import type { ProviderId, ProviderConfig } from '../types';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        keyPlaceholder: 'sk-or-...',
        modelsEndpoint: '/models',
        defaultModel: { id: 'google/gemma-3-27b-it:free', name: 'Google: Gemma 3 27B' },
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        keyPlaceholder: 'sk-...',
        modelsEndpoint: '/models',
        defaultModel: { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
    },
    google: {
        id: 'google',
        name: 'Google AI',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        keyPlaceholder: 'AIza...',
        defaultModel: { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    },
};

export const DEFAULT_PROVIDER: ProviderId = 'openrouter';

export const PROVIDER_LIST = Object.values(PROVIDERS);

/** localStorage key for the API key of a given provider+user */
export function apiKeyStorageKey(providerId: ProviderId, user: string): string {
    return `apiKey_${providerId}_${user}`;
}

/** localStorage key for selected provider of a given user */
export function selectedProviderKey(user: string): string {
    return `selectedProvider_${user}`;
}
