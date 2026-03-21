import type { ProviderId, ProviderConfig } from '../types';

function envDefault(key: string, fallback: string): string {
    return import.meta.env[key] || fallback;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        keyPlaceholder: 'sk-or-...',
        defaultModel: {
            id: envDefault('VITE_DEFAULT_MODEL_OPENROUTER', 'google/gemma-3-27b-it:free'),
            name: 'Default',
        },
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        keyPlaceholder: 'sk-...',
        defaultModel: {
            id: envDefault('VITE_DEFAULT_MODEL_OPENAI', 'gpt-5.4-mini'),
            name: 'Default',
        },
    },
    google: {
        id: 'google',
        name: 'Google AI',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        keyPlaceholder: 'AIza...',
        defaultModel: {
            id: envDefault('VITE_DEFAULT_MODEL_GOOGLE', 'gemini-3-flash-preview'),
            name: 'Default',
        },
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
