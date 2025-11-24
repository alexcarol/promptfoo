"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../src/assertions/index");
const store_1 = require("../../src/tracing/store");
// Mock the trace store
jest.mock('../../src/tracing/store');
// Mock Python execution
jest.mock('../../src/python/wrapper', () => ({
    runPythonCode: jest.fn((code, _functionName, args) => {
        // Simple Python interpreter mock for our test cases
        const [_output, context] = args;
        // Handle the specific test cases
        if (code.includes("len(context.trace['spans']) == 2")) {
            return context.trace && context.trace.spans && context.trace.spans.length === 2;
        }
        if (code.includes('root_spans') && code.includes('leaf_spans')) {
            const trace = context.trace;
            if (!trace) {
                return false;
            }
            const rootSpans = trace.spans.filter((s) => !s.parentSpanId);
            const leafSpans = trace.spans.filter((s) => s.parentSpanId);
            return rootSpans.length === 1 && leafSpans.length === 1;
        }
        if (code.includes('avg_duration')) {
            const trace = context.trace;
            if (!trace) {
                return false;
            }
            const durations = trace.spans
                .filter((s) => s.endTime)
                .map((s) => s.endTime - s.startTime);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            return {
                pass: true,
                score: 0.9,
                reason: `Average span duration: ${avgDuration}ms`,
            };
        }
        return false;
    }),
}));
describe('trace assertions', () => {
    const mockTraceStore = {
        getTrace: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
        store_1.getTraceStore.mockReturnValue(mockTraceStore);
    });
    const mockTest = {
        vars: { test: 'value' },
    };
    const mockProviderResponse = {
        output: 'Test output',
    };
    const mockTraceData = {
        traceId: 'test-trace-id',
        spans: [
            {
                spanId: 'span-1',
                name: 'http.request',
                startTime: 1000,
                endTime: 1500,
                attributes: { 'http.method': 'GET' },
                statusCode: 200,
            },
            {
                spanId: 'span-2',
                parentSpanId: 'span-1',
                name: 'api.call',
                startTime: 1100,
                endTime: 1400,
                attributes: { 'api.name': 'test-api' },
            },
        ],
    };
    describe('javascript assertions with trace', () => {
        it('should pass trace data to javascript assertion', async () => {
            mockTraceStore.getTrace.mockResolvedValue(mockTraceData);
            const assertion = {
                type: 'javascript',
                value: `
          if (!context.trace) return false;
          return context.trace.spans.length === 2 && 
                 context.trace.traceId === 'test-trace-id';
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
            expect(mockTraceStore.getTrace).toHaveBeenCalledWith('test-trace-id');
        });
        it('should handle missing trace gracefully', async () => {
            mockTraceStore.getTrace.mockResolvedValue(null);
            const assertion = {
                type: 'javascript',
                value: 'context.trace === undefined',
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'non-existent-trace',
            });
            expect(result.pass).toBe(true);
        });
        it('should calculate trace duration correctly', async () => {
            mockTraceStore.getTrace.mockResolvedValue(mockTraceData);
            const assertion = {
                type: 'javascript',
                value: `
          const duration = Math.max(...context.trace.spans.map(s => s.endTime || 0)) - 
                          Math.min(...context.trace.spans.map(s => s.startTime));
          return duration === 500; // 1500 - 1000
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
        });
        it('should detect error spans', async () => {
            const traceWithError = {
                traceId: 'error-trace',
                spans: [
                    ...mockTraceData.spans,
                    {
                        spanId: 'error-span',
                        name: 'failed.request',
                        startTime: 2000,
                        endTime: 2100,
                        statusCode: 500,
                        statusMessage: 'Internal Server Error',
                    },
                ],
            };
            mockTraceStore.getTrace.mockResolvedValue(traceWithError);
            const assertion = {
                type: 'javascript',
                value: `
          const errorSpans = context.trace.spans.filter(s => s.statusCode >= 400);
          return errorSpans.length === 1 && errorSpans[0].statusCode === 500;
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'error-trace',
            });
            expect(result.pass).toBe(true);
        });
        it('should work without traceId', async () => {
            const assertion = {
                type: 'javascript',
                value: 'context.trace === undefined && output === "Test output"',
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                // No traceId provided
            });
            expect(result.pass).toBe(true);
            expect(mockTraceStore.getTrace).not.toHaveBeenCalled();
        });
    });
    describe('python assertions with trace', () => {
        it('should pass trace data to python assertion', async () => {
            mockTraceStore.getTrace.mockResolvedValue(mockTraceData);
            const assertion = {
                type: 'python',
                value: `
if not hasattr(context, 'trace') or context.trace is None:
    return False
return len(context.trace['spans']) == 2
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
        });
        it('should analyze span hierarchy in python', async () => {
            mockTraceStore.getTrace.mockResolvedValue(mockTraceData);
            const assertion = {
                type: 'python',
                value: `
root_spans = [s for s in context.trace['spans'] if not s.get('parentSpanId')]
leaf_spans = [s for s in context.trace['spans'] if s.get('parentSpanId')]
return len(root_spans) == 1 and len(leaf_spans) == 1
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
        });
        it('should return grading result object from python', async () => {
            mockTraceStore.getTrace.mockResolvedValue(mockTraceData);
            const assertion = {
                type: 'python',
                value: `
avg_duration = sum(s['endTime'] - s['startTime'] for s in context.trace['spans'] if s.get('endTime')) / len(context.trace['spans'])
return {
    'pass': True,
    'score': 0.9,
    'reason': f"Average span duration: {avg_duration}ms"
}
        `,
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
            expect(result.score).toBe(0.9);
            expect(result.reason).toContain('Average span duration');
        });
    });
    describe('trace store error handling', () => {
        it('should handle trace store errors gracefully', async () => {
            mockTraceStore.getTrace.mockRejectedValue(new Error('Database error'));
            const assertion = {
                type: 'javascript',
                value: 'context.trace === undefined',
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test: mockTest,
                providerResponse: mockProviderResponse,
                traceId: 'test-trace-id',
            });
            expect(result.pass).toBe(true);
            expect(mockTraceStore.getTrace).toHaveBeenCalledWith('test-trace-id');
        });
    });
});
//# sourceMappingURL=trace.test.js.map