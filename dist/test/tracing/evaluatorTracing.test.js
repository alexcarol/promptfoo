"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const evaluatorTracing_1 = require("../../src/tracing/evaluatorTracing");
// Mock the logger
globals_1.jest.mock('../../src/logger', () => ({
    default: {
        debug: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
    },
}));
// Mock the trace store
globals_1.jest.mock('../../src/tracing/store', () => ({
    getTraceStore: globals_1.jest.fn(() => ({
        createTrace: globals_1.jest.fn(),
    })),
}));
(0, globals_1.describe)('evaluatorTracing', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        // Reset environment variables
        delete process.env.PROMPTFOO_TRACING_ENABLED;
    });
    (0, globals_1.describe)('generateTraceId', () => {
        (0, globals_1.it)('should generate a 32-character hex string', () => {
            const traceId = (0, evaluatorTracing_1.generateTraceId)();
            (0, globals_1.expect)(traceId).toMatch(/^[a-f0-9]{32}$/);
            (0, globals_1.expect)(traceId).toHaveLength(32);
        });
        (0, globals_1.it)('should generate unique IDs', () => {
            const id1 = (0, evaluatorTracing_1.generateTraceId)();
            const id2 = (0, evaluatorTracing_1.generateTraceId)();
            (0, globals_1.expect)(id1).not.toBe(id2);
        });
    });
    (0, globals_1.describe)('generateSpanId', () => {
        (0, globals_1.it)('should generate a 16-character hex string', () => {
            const spanId = (0, evaluatorTracing_1.generateSpanId)();
            (0, globals_1.expect)(spanId).toMatch(/^[a-f0-9]{16}$/);
            (0, globals_1.expect)(spanId).toHaveLength(16);
        });
        (0, globals_1.it)('should generate unique IDs', () => {
            const id1 = (0, evaluatorTracing_1.generateSpanId)();
            const id2 = (0, evaluatorTracing_1.generateSpanId)();
            (0, globals_1.expect)(id1).not.toBe(id2);
        });
    });
    (0, globals_1.describe)('generateTraceparent', () => {
        (0, globals_1.it)('should generate valid W3C Trace Context format with sampled flag', () => {
            const traceId = 'a'.repeat(32);
            const spanId = 'b'.repeat(16);
            const traceparent = (0, evaluatorTracing_1.generateTraceparent)(traceId, spanId, true);
            (0, globals_1.expect)(traceparent).toBe(`00-${traceId}-${spanId}-01`);
        });
        (0, globals_1.it)('should generate valid W3C Trace Context format without sampled flag', () => {
            const traceId = 'a'.repeat(32);
            const spanId = 'b'.repeat(16);
            const traceparent = (0, evaluatorTracing_1.generateTraceparent)(traceId, spanId, false);
            (0, globals_1.expect)(traceparent).toBe(`00-${traceId}-${spanId}-00`);
        });
        (0, globals_1.it)('should default to sampled=true', () => {
            const traceId = 'a'.repeat(32);
            const spanId = 'b'.repeat(16);
            const traceparent = (0, evaluatorTracing_1.generateTraceparent)(traceId, spanId);
            (0, globals_1.expect)(traceparent).toBe(`00-${traceId}-${spanId}-01`);
        });
    });
    (0, globals_1.describe)('generateTraceContextIfNeeded', () => {
        (0, globals_1.it)('should return null when tracing is not enabled', async () => {
            const test = {
                vars: { foo: 'bar' },
            };
            const result = await (0, evaluatorTracing_1.generateTraceContextIfNeeded)(test, {}, 0, 0);
            (0, globals_1.expect)(result).toBeNull();
        });
        (0, globals_1.it)('should generate trace context when tracing is enabled via metadata', async () => {
            const test = {
                vars: { foo: 'bar' },
                metadata: {
                    tracingEnabled: true,
                    evaluationId: 'eval-123',
                    testCaseId: 'test-456',
                },
            };
            const result = await (0, evaluatorTracing_1.generateTraceContextIfNeeded)(test, {}, 0, 0);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
            (0, globals_1.expect)(result.evaluationId).toBe('eval-123');
            (0, globals_1.expect)(result.testCaseId).toBe('test-456');
        });
        (0, globals_1.it)('should generate trace context when tracing is enabled via environment', async () => {
            process.env.PROMPTFOO_TRACING_ENABLED = 'true';
            const test = {
                vars: { foo: 'bar' },
            };
            const result = await (0, evaluatorTracing_1.generateTraceContextIfNeeded)(test, {}, 5, 10);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
            (0, globals_1.expect)(result.evaluationId).toMatch(/^eval-/);
            (0, globals_1.expect)(result.testCaseId).toBe('5-10');
        });
    });
    (0, globals_1.describe)('isOtlpReceiverStarted', () => {
        (0, globals_1.it)('should return false initially', () => {
            (0, globals_1.expect)((0, evaluatorTracing_1.isOtlpReceiverStarted)()).toBe(false);
        });
    });
});
//# sourceMappingURL=evaluatorTracing.test.js.map