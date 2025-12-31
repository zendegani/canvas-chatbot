import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModels, chatCompletion } from './openRouterService';
import { mockFetch } from '../test/setup';

describe('openRouterService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchModels', () => {
        it('returns default models when no API key is provided', async () => {
            const models = await fetchModels('');

            expect(models).toHaveLength(3);
            expect(models[0].id).toBe('google/gemini-pro');
            expect(models[1].id).toBe('openai/gpt-3.5-turbo');
            expect(models[2].id).toBe('mistralai/mistral-7b-instruct');
        });

        it('fetches models from API with valid API key', async () => {
            const mockModels = [
                { id: 'test-model-1', name: 'Test Model 1', context_length: 4096, pricing: { prompt: '0.001', completion: '0.002' } },
                { id: 'test-model-2', name: 'Test Model 2', context_length: 8192, pricing: { prompt: '0.002', completion: '0.004' } },
            ];
            mockFetch({ data: mockModels });

            const models = await fetchModels('valid-api-key');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/models',
                expect.objectContaining({
                    method: 'GET',
                    headers: { Authorization: 'Bearer valid-api-key' },
                })
            );
            expect(models).toEqual(mockModels);
        });

        it('returns fallback models on API error', async () => {
            mockFetch({ error: 'Server Error' }, false, 500);

            const models = await fetchModels('valid-api-key');

            expect(models).toHaveLength(2);
            expect(models[0].name).toContain('Fallback');
        });
    });

    describe('chatCompletion', () => {
        it('throws error when no API key is provided', async () => {
            await expect(chatCompletion('', 'model-id', [])).rejects.toThrow(
                'API Key is missing'
            );
        });

        it('returns assistant message on success', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Hello! How can I help you?' } }],
            };
            mockFetch(mockResponse);

            const result = await chatCompletion('valid-key', 'google/gemini-pro', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('Hello! How can I help you?');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer valid-key',
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('throws error on API failure', async () => {
            mockFetch({ error: { message: 'Rate limit exceeded' } }, false, 429);

            await expect(
                chatCompletion('valid-key', 'model-id', [{ role: 'user', content: 'Hi' }])
            ).rejects.toThrow('Rate limit exceeded');
        });

        it('returns empty string when no choices in response', async () => {
            mockFetch({ choices: [] });

            const result = await chatCompletion('valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('');
        });
    });
});
