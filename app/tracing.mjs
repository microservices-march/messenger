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

// To start with tracing run the app with: node --require './instrumentation.js' index.mjs
// To get a meter anywher in the app, do this:
// import opentelemetry from "@opentelemetry/api";
// const myMeter = opentelemetry.metrics.getMeter("some name");
// const counter = myMeter.createCounter("events.counter");
// counter.add(1);

// See opentelemetry.io/docs/instrumentation/js/instrumentation

// For troubleshooting, set the log level to DiagLogLeve.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: "messenger",
});

// Now for some java-ass metrics gobbledygook
// const metricReader = new PeriodicExportingMetricReader({
//   exporter: new ConsoleMetricExporter(),
//   exportIntervalMillis: 3000,
// });

// const myServiceMeterProvider = new MeterProvider({
//   resource
// });

// myServiceMeterProvider.addMetricReader(metricReader);

// opentelemetry.metrics.setGlobalMeterProvider(myServiceMeterProvider);

// Now I can 

const sdk = new opentelemetry.NodeSDK({
  resource,
  // traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  traceExporter: new OTLPTraceExporter({
    // optional: default url is http://localhost:4318/v1/traces
    url: "http://jaeger_1:4318/v1/traces",
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
