import type { TestCase, TestSuite } from '../types/index';
/**
 * Generate a 16-byte trace ID
 */
export declare function generateTraceId(): string;
/**
 * Generate an 8-byte span ID
 */
export declare function generateSpanId(): string;
/**
 * Generate W3C Trace Context format traceparent header
 * Format: version-trace-id-parent-id-trace-flags
 */
export declare function generateTraceparent(traceId: string, spanId: string, sampled?: boolean): string;
/**
 * Check if the OTLP receiver has been started
 */
export declare function isOtlpReceiverStarted(): boolean;
/**
 * Start the OTLP receiver if tracing is enabled and it hasn't been started yet
 */
export declare function startOtlpReceiverIfNeeded(testSuite: TestSuite): Promise<void>;
/**
 * Stop the OTLP receiver if it was started
 */
export declare function stopOtlpReceiverIfNeeded(): Promise<void>;
/**
 * Check if tracing is enabled for a test case
 */
export declare function isTracingEnabled(test: TestCase, _testSuite?: TestSuite): boolean;
/**
 * Generate trace context and create trace record if tracing is enabled
 */
export declare function generateTraceContextIfNeeded(test: TestCase, evaluateOptions: any, testIdx: number, promptIdx: number): Promise<{
    traceparent?: string;
    evaluationId?: string;
    testCaseId?: string;
} | null>;
//# sourceMappingURL=evaluatorTracing.d.ts.map