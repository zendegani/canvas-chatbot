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

const API_KEY_ENC_PREFIX = 'enc:';

/** Encode an API key so it is not stored as clear text in localStorage. */
export function encodeApiKey(plain: string): string {
    if (!plain) return '';
    try { return API_KEY_ENC_PREFIX + btoa(plain); }
    catch { return API_KEY_ENC_PREFIX + plain; }
}

/** Decode a previously-encoded API key. Handles legacy clear-text values transparently. */
export function decodeApiKey(stored: string | null): string {
    if (!stored) return '';
    if (!stored.startsWith(API_KEY_ENC_PREFIX)) return stored;
    const encoded = stored.substring(API_KEY_ENC_PREFIX.length);
    try { return atob(encoded); }
    catch { return encoded; }
}

/** localStorage key for selected provider of a given user */
export function selectedProviderKey(user: string): string {
    return `selectedProvider_${user}`;
}

/** localStorage key for the Tavily web-search API key of a given user */
export function tavilyKeyStorageKey(user: string): string {
    return `tavilyKey_${user}`;
}

export interface PhoenixConfig {
    endpoint: string;
    apiKey?: string;
    project?: string;
}

/** localStorage key for the user's Phoenix tracing config */
export function phoenixConfigStorageKey(user: string): string {
    return `phoenixConfig_${user}`;
}

export function loadPhoenixConfig(user: string): PhoenixConfig | null {
    if (!user) return null;
    const raw = localStorage.getItem(phoenixConfigStorageKey(user));
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.endpoint === 'string' && parsed.endpoint.trim()) {
            return {
                endpoint: parsed.endpoint.trim(),
                apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined,
                project: typeof parsed.project === 'string' ? parsed.project : undefined,
            };
        }
    } catch { /* fall through */ }
    return null;
}

export function savePhoenixConfig(user: string, config: PhoenixConfig | null): void {
    if (!user) return;
    const key = phoenixConfigStorageKey(user);
    if (!config || !config.endpoint.trim()) {
        localStorage.removeItem(key);
        return;
    }
    localStorage.setItem(key, JSON.stringify({
        endpoint: config.endpoint.trim(),
        apiKey: config.apiKey?.trim() || undefined,
        project: config.project?.trim() || undefined,
    }));
}
