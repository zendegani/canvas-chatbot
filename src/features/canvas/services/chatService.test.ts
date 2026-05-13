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
        // Helper to create a mock ReadableStream from text
        function mockStreamResponse(text: string, ok = true, status = 200) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(text));
                    controller.close();
                },
            });
            global.fetch = vi.fn().mockResolvedValue({
                ok,
                status,
                statusText: ok ? 'OK' : 'Error',
                body: stream,
                text: () => Promise.resolve(text),
            });
        }

        it('throws error when no API key is provided', async () => {
            const provider = PROVIDERS.openrouter;
            await expect(chatCompletion(provider, '', 'model-id', [])).rejects.toThrow(
                'API Key is missing'
            );
        });

        it('posts to /api/chat with correct payload', async () => {
            mockStreamResponse('Hello! How can I help you?');

            const provider = PROVIDERS.openai;
            const result = await chatCompletion(provider, 'valid-key', 'gpt-5.4-mini', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('Hello! How can I help you?');
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/chat',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: 'openai',
                        apiKey: 'valid-key',
                        model: 'gpt-5.4-mini',
                        messages: [{ role: 'user', content: 'Hello' }],
                    }),
                })
            );
        });

        it('sends provider id in payload for all providers', async () => {
            mockStreamResponse('Hi');

            const provider = PROVIDERS.openrouter;
            await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            const callArgs = vi.mocked(global.fetch).mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            expect(body.provider).toBe('openrouter');
            expect(body.apiKey).toBe('valid-key');
        });

        it('throws error on API failure', async () => {
            mockStreamResponse('Rate limit exceeded', false, 429);

            const provider = PROVIDERS.openai;
            await expect(
                chatCompletion(provider, 'valid-key', 'model-id', [{ role: 'user', content: 'Hi' }])
            ).rejects.toThrow('Rate limit exceeded');
        });

        it('collects multi-chunk stream into full text', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('Hello'));
                    controller.enqueue(encoder.encode(' World'));
                    controller.enqueue(encoder.encode('!'));
                    controller.close();
                },
            });
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                body: stream,
            });

            const provider = PROVIDERS.openai;
            const result = await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hello' },
            ]);

            expect(result).toBe('Hello World!');
        });

        it('includes tools.tavily.apiKey in the request body when passed', async () => {
            mockStreamResponse('ok');

            const provider = PROVIDERS.openrouter;
            await chatCompletion(
                provider,
                'valid-key',
                'model-id',
                [{ role: 'user', content: 'What is happening today?' }],
                undefined,
                { tavily: { apiKey: 'tvly-secret' } },
            );

            const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
            expect(body.tools).toEqual({ tavily: { apiKey: 'tvly-secret' } });
        });

        it('omits tools field when not passed', async () => {
            mockStreamResponse('ok');

            const provider = PROVIDERS.openrouter;
            await chatCompletion(provider, 'valid-key', 'model-id', [
                { role: 'user', content: 'Hi' },
            ]);

            const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
            expect(body.tools).toBeUndefined();
        });

        it('calls onChunk with accumulated text on each stream chunk', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('Hello'));
                    controller.enqueue(encoder.encode(' World'));
                    controller.close();
                },
            });
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                body: stream,
            });

            const chunks: string[] = [];
            const provider = PROVIDERS.openai;
            await chatCompletion(
                provider, 'valid-key', 'model-id',
                [{ role: 'user', content: 'Hi' }],
                (accumulated) => chunks.push(accumulated),
            );

            expect(chunks).toEqual(['Hello', 'Hello World']);
        });
    });

});
