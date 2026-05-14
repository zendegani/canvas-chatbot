/**
 * OpenTelemetry → Arize Phoenix tracing for the Vercel AI SDK.
 *
 * Activates only when PHOENIX_COLLECTOR_ENDPOINT is set in the environment
 * (so prod stays a no-op until you decide to point this at a hosted Phoenix
 * or Arize Cloud). Idempotent — safe to import multiple times.
 *
 * IMPORTANT: this file must be imported before the `ai` package is loaded,
 * or the AI SDK's spans will not be captured. Import it as the FIRST line
 * of any handler that calls `streamText` / `generateText`.
 */
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SEMRESATTRS_PROJECT_NAME } from '@arizeai/openinference-semantic-conventions';
import { OpenInferenceSimpleSpanProcessor } from '@arizeai/openinference-vercel';

declare global {
    // eslint-disable-next-line no-var
    var __phoenixProvider: NodeTracerProvider | undefined;
}

const COLLECTOR_ENDPOINT = process.env.PHOENIX_COLLECTOR_ENDPOINT;
const SERVICE_NAME = process.env.PHOENIX_PROJECT_NAME || 'canvas-ai';

if (!globalThis.__phoenixProvider && COLLECTOR_ENDPOINT) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

    const headers: Record<string, string> = {};
    if (process.env.PHOENIX_API_KEY) {
        headers.Authorization = `Bearer ${process.env.PHOENIX_API_KEY}`;
    }

    const provider = new NodeTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: SERVICE_NAME,
            [SEMRESATTRS_PROJECT_NAME]: SERVICE_NAME,
        }),
        spanProcessors: [
            new OpenInferenceSimpleSpanProcessor({
                exporter: new OTLPTraceExporter({
                    url: `${COLLECTOR_ENDPOINT.replace(/\/$/, '')}/v1/traces`,
                    headers,
                }),
            }),
        ],
    });

    provider.register();
    globalThis.__phoenixProvider = provider;
    console.log(`[phoenix] tracing enabled → ${COLLECTOR_ENDPOINT} (project: ${SERVICE_NAME})`);
}

/**
 * Call before returning from a serverless function. With SimpleSpanProcessor +
 * async OTLP fetch, the function can finish before the exporter actually sends
 * spans to Phoenix; forceFlush ensures pending spans are awaited.
 */
export async function flushTraces(): Promise<void> {
    await globalThis.__phoenixProvider?.forceFlush();
}
