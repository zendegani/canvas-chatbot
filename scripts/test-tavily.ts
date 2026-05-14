/**
 * End-to-end test for the Tavily web-search tool pipeline.
 *
 * Add the following to .env.local before running:
 *   TAVILY_API_KEY=tvly-...
 *   plus ONE of:
 *     OPENROUTER_API_KEY=sk-or-...
 *     OPENAI_API_KEY=sk-...
 *     GOOGLE_API_KEY=...
 *
 * Run with: npx tsx scripts/test-tavily.ts
 *
 * The script prints whether the LLM actually invoked the tool, what query it
 * sent, how many results came back, and the final answer. Exits 0 if the tool
 * was called at least once, 1 otherwise.
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
if (!TAVILY_API_KEY) {
    console.error('❌ Missing TAVILY_API_KEY in .env.local');
    process.exit(1);
}

function pickModel() {
    if (process.env.OPENROUTER_API_KEY) {
        const or = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
        return { model: or.chat('openai/gpt-4o-mini'), label: 'openrouter:openai/gpt-4o-mini' };
    }
    if (process.env.OPENAI_API_KEY) {
        const oai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return { model: oai('gpt-4o-mini'), label: 'openai:gpt-4o-mini' };
    }
    if (process.env.GOOGLE_API_KEY) {
        const g = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });
        return { model: g('gemini-2.0-flash'), label: 'google:gemini-2.0-flash' };
    }
    if (process.env.MINIMAX_API_KEY) {
        const groupId = process.env.MINIMAX_GROUP_ID;
        if (!groupId) {
            console.error('❌ MINIMAX_GROUP_ID is required alongside MINIMAX_API_KEY.');
            process.exit(1);
        }
        // MiniMax's native chat endpoint takes OpenAI-shaped JSON, but the path
        // is /v1/text/chatcompletion_v2 and it needs ?GroupId=<id>.
        const wrappedFetch: typeof fetch = (input, init) => {
            let url = typeof input === 'string'
                ? input
                : input instanceof URL ? input.toString() : input.url;
            url = url.replace('/v1/chat/completions', '/v1/text/chatcompletion_v2');
            url += (url.includes('?') ? '&' : '?') + `GroupId=${encodeURIComponent(groupId)}`;
            return fetch(url, init);
        };
        const mm = createOpenAI({
            apiKey: process.env.MINIMAX_API_KEY,
            baseURL: 'https://api.minimax.io/v1',
            fetch: wrappedFetch,
        });
        return { model: mm.chat('MiniMax-M2.7'), label: 'minimax:MiniMax-M2.7' };
    }
    console.error('❌ Set one of OPENROUTER_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY / MINIMAX_API_KEY in .env.local');
    process.exit(1);
}

const { model, label } = pickModel();
console.log(`▶ Using ${label}\n`);

let toolCallCount = 0;
let toolResultCount = 0;

const tavilyTool = tool({
    description:
        'Search the web for current, factual information. Use when the user asks about recent events, ' +
        'specific facts you may not know, or anything that benefits from up-to-date sources.',
    inputSchema: z.object({
        query: z.string().describe('The search query.'),
        max_results: z.number().int().min(1).max(10).optional().describe('How many results to return. Default 5.'),
    }),
    execute: async ({ query, max_results = 5 }) => {
        toolCallCount++;
        console.log(`🔍 Tavily search call #${toolCallCount}: "${query}" (max ${max_results})`);
        const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query,
                max_results,
                search_depth: 'basic',
            }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error(`   ↳ ❌ Tavily error ${res.status}: ${text || res.statusText}`);
            return { error: `Tavily error ${res.status}: ${text || res.statusText}` };
        }
        const data = (await res.json()) as {
            results?: Array<{ title: string; url: string; content: string }>;
            answer?: string;
        };
        toolResultCount++;
        console.log(`   ↳ ✅ Got ${data.results?.length ?? 0} results${data.answer ? ' + answer summary' : ''}`);
        return {
            answer: data.answer,
            results: (data.results ?? []).map(r => ({
                title: r.title,
                url: r.url,
                content: r.content,
            })),
        };
    },
});

const QUESTION =
    'What is the latest news about Anthropic from this week? ' +
    'Use the web search tool and cite at least one source URL.';

console.log(`Q: ${QUESTION}\n`);
console.log('--- LLM response ---');

const result = streamText({
    model,
    messages: [{ role: 'user', content: QUESTION }],
    tools: { tavilySearch: tavilyTool },
    stopWhen: stepCountIs(5),
});

let fullText = '';
try {
    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
    }
} catch (err) {
    console.error('\n❌ Stream error:', err instanceof Error ? err.message : err);
    process.exit(2);
}

console.log('\n--- end ---\n');
console.log(`Tool calls:        ${toolCallCount}`);
console.log(`Tool results OK:   ${toolResultCount}`);
console.log(`Output length:     ${fullText.length} chars`);

if (toolCallCount === 0) {
    console.log('\n⚠️  The model did NOT invoke the search tool. Either the model decided');
    console.log('   it could answer without search, or the tool is not wired correctly.');
    process.exit(1);
}
console.log('\n✅ Tool pipeline works.');
process.exit(0);
