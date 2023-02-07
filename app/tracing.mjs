import opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";

// For troubleshooting, set the log level to DiagLogLeve.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Now for some java-ass metrics gobbledygook
const metricReader = new PeriodicExportingMetricReader({
  exporter: new ConsoleMetricExporter(),
  exportIntervalMillis: 3000,
});

const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "messenger",
  }),
  // traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  traceExporter: new OTLPTraceExporter({
    // optional: default url is http://localhost:4318/v1/traces
    // url: "<your-otlp-endpoit>/v1/traces",
    // optional: A collection of custom headers to be sent with each request, empty be default
    headers: {},
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // We don't need every pool connection in our traces for now
      "@opentelemetry/instrumentation-pg-pool": {
        enabled: false,
      },
      // node apparently does a lot of fs actions behind the scenes which pollute our
      // traces
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-pg": {
        // Let's see what this does'
        enhancedDatabaseReporting: true,
      },
    }),
  ],
});

sdk.start();

export default sdk;
