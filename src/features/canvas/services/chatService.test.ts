import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModels, chatCompletion } from './chatService';
import { PROVIDERS } from './providers';
import { mockFetch } from '../../../test/setup';

describe('chatService', () => {
    const testUser = 'test@example.com';

    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    describe('fetchModels', () => {
        it('returns default model when no API key is provided', async () => {
            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, '', testUser);

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe(provider.defaultModel.id);
        });

        it('fetches models from OpenRouter API', async () => {
            const mockModels = [
                { id: 'test-model-1', name: 'Test Model 1', context_length: 4096 },
                { id: 'test-model-2', name: 'Test Model 2', context_length: 8192 },
            ];
            mockFetch({ data: mockModels });

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(global.fetch).toHaveBeenCalledWith(
                `${provider.baseUrl}/models`,
                expect.objectContaining({
                    headers: { Authorization: 'Bearer valid-key' },
                })
            );
            expect(models).toHaveLength(2);
            expect(models[0].id).toBe('test-model-1');
        });

        it('filters OpenAI models by chat prefixes', async () => {
            const allModels = [
                { id: 'gpt-5.4-mini', created: 300 },
                { id: 'gpt-4o', created: 200 },
                { id: 'dall-e-3', created: 100 },        // should be excluded
                { id: 'text-embedding-ada', created: 50 }, // should be excluded
                { id: 'tts-1', created: 40 },              // should be excluded
                { id: 'gpt-4o-audio-preview', created: 30 }, // excluded (audio)
                { id: 'o3-mini', created: 250 },
            ];
            mockFetch({ data: allModels });

            const provider = PROVIDERS.openai;
            const models = await fetchModels(provider, 'valid-key', testUser);

            const ids = models.map(m => m.id);
            expect(ids).toContain('gpt-5.4-mini');
            expect(ids).toContain('gpt-4o');
            expect(ids).toContain('o3-mini');
            expect(ids).not.toContain('dall-e-3');
            expect(ids).not.toContain('text-embedding-ada');
            expect(ids).not.toContain('tts-1');
            expect(ids).not.toContain('gpt-4o-audio-preview');
        });

        it('sorts OpenAI models by created date (newest first)', async () => {
            const allModels = [
                { id: 'gpt-4o', created: 100 },
                { id: 'gpt-5.4-mini', created: 300 },
                { id: 'o3-mini', created: 200 },
            ];
            mockFetch({ data: allModels });

            const provider = PROVIDERS.openai;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(models[0].id).toBe('gpt-5.4-mini');
            expect(models[1].id).toBe('o3-mini');
            expect(models[2].id).toBe('gpt-4o');
        });

        it('filters Google models by supportedGenerationMethods', async () => {
            const googleModels = [
                { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/embedding-001', displayName: 'Embedding', supportedGenerationMethods: ['embedContent'] },
                { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/aqa', displayName: 'AQA', supportedGenerationMethods: ['generateAnswer'] },
            ];
            mockFetch({ models: googleModels });

            const provider = PROVIDERS.google;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(models).toHaveLength(2);
            // Google model IDs should have "models/" prefix stripped
            expect(models[0].id).toBe('gemini-2.5-flash');
            expect(models[1].id).toBe('gemini-2.0-flash');
        });

        it('uses Google native endpoint with key query param', async () => {
            mockFetch({ models: [] });

            const provider = PROVIDERS.google;
            await fetchModels(provider, 'test-api-key', testUser);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('key=test-api-key'),
            );
            // Should NOT use Bearer auth for Google's model list
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('generativelanguage.googleapis.com'),
            );
        });

        // ── Caching tests ──

        it('returns cached models within TTL', async () => {
            // Seed cache
            const cached = {
                models: [{ id: 'cached-model', name: 'Cached' }],
                fetchedAt: Date.now() - 60_000, // 1 minute ago (within 2h TTL)
            };
            localStorage.setItem(`modelCache_openrouter_${testUser}`, JSON.stringify(cached));

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe('cached-model');
            // Should NOT have called fetch
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('refetches when cache is expired', async () => {
            // Seed expired cache (3 hours old)
            const cached = {
                models: [{ id: 'stale-model', name: 'Stale' }],
                fetchedAt: Date.now() - 3 * 60 * 60 * 1000,
            };
            localStorage.setItem(`modelCache_openrouter_${testUser}`, JSON.stringify(cached));

            const freshModels = [
                { id: 'fresh-model', name: 'Fresh Model' },
            ];
            mockFetch({ data: freshModels });

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(global.fetch).toHaveBeenCalled();
            expect(models[0].id).toBe('fresh-model');
        });

        it('falls back to stale cache on API error', async () => {
            // Seed expired cache
            const cached = {
                models: [{ id: 'stale-model', name: 'Stale' }],
                fetchedAt: Date.now() - 3 * 60 * 60 * 1000,
            };
            localStorage.setItem(`modelCache_openrouter_${testUser}`, JSON.stringify(cached));

            mockFetch({ error: 'Server Error' }, false, 500);

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(models[0].id).toBe('stale-model');
        });

        it('falls back to defaultModel on error with no cache', async () => {
            mockFetch({ error: 'Server Error' }, false, 500);

            const provider = PROVIDERS.openrouter;
            const models = await fetchModels(provider, 'valid-key', testUser);

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe(provider.defaultModel.id);
        });

        it('writes to cache after successful fetch', async () => {
            mockFetch({ data: [{ id: 'new-model', name: 'New Model' }] });

            const provider = PROVIDERS.openrouter;
            await fetchModels(provider, 'valid-key', testUser);

            const raw = localStorage.getItem(`modelCache_openrouter_${testUser}`);
            expect(raw).not.toBeNull();
            const cached = JSON.parse(raw!);
            expect(cached.models[0].id).toBe('new-model');
            expect(cached.fetchedAt).toBeGreaterThan(0);
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
