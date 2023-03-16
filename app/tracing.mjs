import opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const IGNORED_EXPRESS_SPANS = new Set([
  "middleware - expressInit",
  "middleware - corsMiddleware",
]);

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: "messenger",
});

const sdk = new opentelemetry.NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ headers: {} }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-express": {
        ignoreLayers: [
          (name) => {
            return IGNORED_EXPRESS_SPANS.has(name);
          },
        ],
      },
    }),
  ],
});

sdk.start();
