/**
 * OpenTelemetry → Arize Phoenix tracing for the Vercel AI SDK.
 *
 * Provides a per-(endpoint, project) TracerProvider so the client can pick the
 * collector at request time (set in Settings → Tracing). Falls back to the
 * env-var configuration if the request doesn't include Phoenix headers, so
 * `.env.local` still works for server-only setups.
 *
 * IMPORTANT: this file must be imported before the `ai` package is loaded so
 * the `@opentelemetry/api` context is set up first.
 */
import { diag, DiagConsoleLogger, DiagLogLevel, trace, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SEMRESATTRS_PROJECT_NAME } from '@arizeai/openinference-semantic-conventions';
import { OpenInferenceSimpleSpanProcessor } from '@arizeai/openinference-vercel';

export interface PhoenixConfig {
    endpoint: string;
    apiKey?: string;
    project?: string;
}

declare global {
    // eslint-disable-next-line no-var
    var __phoenixProviderCache: Map<string, NodeTracerProvider> | undefined;
    // eslint-disable-next-line no-var
    var __phoenixLoggerInstalled: boolean | undefined;
}

const DEFAULT_PROJECT = process.env.PHOENIX_PROJECT_NAME || 'canvas-ai';

function cacheKey(config: PhoenixConfig): string {
    return `${config.endpoint}|${config.project || DEFAULT_PROJECT}`;
}

function buildProvider(config: PhoenixConfig): NodeTracerProvider {
    if (!globalThis.__phoenixLoggerInstalled) {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
        globalThis.__phoenixLoggerInstalled = true;
    }

    const headers: Record<string, string> = {};
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

    const projectName = config.project || DEFAULT_PROJECT;

    return new NodeTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: projectName,
            [SEMRESATTRS_PROJECT_NAME]: projectName,
        }),
        spanProcessors: [
            new OpenInferenceSimpleSpanProcessor({
                exporter: new OTLPTraceExporter({
                    url: `${config.endpoint.replace(/\/$/, '')}/v1/traces`,
                    headers,
                }),
            }),
        ],
    });
}

/** Resolve the Phoenix config for this request — headers win, env is the fallback. */
export function resolvePhoenixConfig(headers: PhoenixConfig | Partial<PhoenixConfig>): PhoenixConfig | null {
    const endpoint = headers.endpoint || process.env.PHOENIX_COLLECTOR_ENDPOINT;
    if (!endpoint) return null;
    return {
        endpoint,
        apiKey: headers.apiKey || process.env.PHOENIX_API_KEY,
        project: headers.project || process.env.PHOENIX_PROJECT_NAME,
    };
}

/** Get (or create + cache) the TracerProvider for a given Phoenix target. */
export function getOrCreateProvider(config: PhoenixConfig): NodeTracerProvider {
    const cache = globalThis.__phoenixProviderCache ??= new Map();
    const key = cacheKey(config);
    const existing = cache.get(key);
    if (existing) return existing;

    const provider = buildProvider(config);
    cache.set(key, provider);
    console.log(`[phoenix] tracing enabled → ${config.endpoint} (project: ${config.project || DEFAULT_PROJECT})`);
    return provider;
}

export function getTracerFor(config: PhoenixConfig): Tracer {
    const provider = getOrCreateProvider(config);
    return provider.getTracer('canvas-ai-chat');
}

/** Force-flush the spans for this Phoenix target. Call before returning from a handler. */
export async function flushTraces(config: PhoenixConfig | null): Promise<void> {
    if (!config) return;
    const cache = globalThis.__phoenixProviderCache;
    await cache?.get(cacheKey(config))?.forceFlush();
}

// Avoid an unused-import warning if `trace` isn't referenced elsewhere; re-export for callers.
export { trace };
