import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModels, chatCompletion } from './chatService';
import { PROVIDERS } from './providers';
import { mockFetch } from '../../../test/setup';

describe('chatService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchModels', () => {
        it('returns default model when no API key is provided', async () => {
            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, '');

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe(provider.defaultModel.id);
        });

        it('returns default model when provider has no models endpoint', async () => {
            const provider = PROVIDERS.google;
            const models = await fetchModels(provider, 'some-key');

            // Google has no modelsEndpoint, so should return default
            expect(models).toHaveLength(1);
            expect(models[0].id).toBe(provider.defaultModel.id);
        });

        it('fetches models from API with valid API key', async () => {
            const mockModels = [
                { id: 'test-model-1', name: 'Test Model 1', context_length: 4096, pricing: { prompt: '0.001', completion: '0.002' } },
                { id: 'test-model-2', name: 'Test Model 2', context_length: 8192, pricing: { prompt: '0.002', completion: '0.004' } },
            ];
            mockFetch({ data: mockModels });

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-api-key');

            expect(global.fetch).toHaveBeenCalledWith(
                `${provider.baseUrl}/models`,
                expect.objectContaining({
                    method: 'GET',
                    headers: { Authorization: 'Bearer valid-api-key' },
                })
            );
            expect(models).toHaveLength(2);
            expect(models[0].id).toBe('test-model-1');
        });

        it('returns default model on API error', async () => {
            mockFetch({ error: 'Server Error' }, false, 500);

            const provider = PROVIDERS.openai;
            const models = await fetchModels(provider, 'valid-api-key');

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe(provider.defaultModel.id);
        });
    });

    describe('chatCompletion', () => {
        it('throws error when no API key is provided', async () => {
            const provider = PROVIDERS.openrouter;
            await expect(chatCompletion(provider, '', 'model-id', [])).rejects.toThrow(
                'API Key is missing'
            );
        });

        it('returns assistant message on success', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Hello! How can I help you?' } }],
            };
            mockFetch(mockResponse);

            const provider = PROVIDERS.openai;
            const result = await chatCompletion(provider, 'valid-key', 'gpt-5.4-mini', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('Hello! How can I help you?');
            expect(global.fetch).toHaveBeenCalledWith(
                `${provider.baseUrl}/chat/completions`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer valid-key',
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('includes OpenRouter-specific headers for openrouter provider', async () => {
            mockFetch({ choices: [{ message: { content: 'Hi' } }] });

            const provider = PROVIDERS.openrouter;
            await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'HTTP-Referer': expect.any(String),
                        'X-Title': 'Canvas AI',
                    }),
                })
            );
        });

        it('does NOT include OpenRouter-specific headers for other providers', async () => {
            mockFetch({ choices: [{ message: { content: 'Hi' } }] });

            const provider = PROVIDERS.google;
            await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            const callArgs = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
            const headers = callArgs.headers as Record<string, string>;
            expect(headers['HTTP-Referer']).toBeUndefined();
            expect(headers['X-Title']).toBeUndefined();
        });

        it('throws error on API failure', async () => {
            mockFetch({ error: { message: 'Rate limit exceeded' } }, false, 429);

            const provider = PROVIDERS.openai;
            await expect(
                chatCompletion(provider, 'valid-key', 'model-id', [{ role: 'user', content: 'Hi' }])
            ).rejects.toThrow('Rate limit exceeded');
        });

        it('returns empty string when no choices in response', async () => {
            mockFetch({ choices: [] });

            const provider = PROVIDERS.openai;
            const result = await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('');
        });
    });
});
