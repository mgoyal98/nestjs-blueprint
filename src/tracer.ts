// tracer.ts
'use strict';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { context, trace } from '@opentelemetry/api';

const exporterOptions = {
  url: process.env.OTEL_EXPORTER_ENDPOINT || 'http://localhost:4317',
};

const traceExporter = new OTLPTraceExporter(exporterOptions);
const metricExporter = new OTLPMetricExporter(exporterOptions);

export const sdk = new NodeSDK({
  serviceName: process.env.APP_NAME || 'nestjs-blueprint',
  autoDetectResources: true,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.APP_NAME || 'nestjs-blueprint',
    ['deployment.environment']: process.env.NODE_ENV || 'development',
    ['service.version']: process.env.APP_VERSION || '0.0.1',
    ['service.namespace']: process.env.APP_NAMESPACE || 'dev',
  }),
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry

export const start = () => sdk.start();

export const getActiveSpan = () => {
  return trace.getSpan(context.active());
};

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
