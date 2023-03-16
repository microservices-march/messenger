import opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
