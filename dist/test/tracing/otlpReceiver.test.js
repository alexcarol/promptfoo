"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const otlpReceiver_1 = require("../../src/tracing/otlpReceiver");
// Mock the database
globals_1.jest.mock('../../src/database', () => ({
    getDb: globals_1.jest.fn(() => ({
        insert: globals_1.jest.fn(),
        select: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
    })),
}));
// Mock the trace store
globals_1.jest.mock('../../src/tracing/store');
// Mock the logger
const mockLogger = {
    debug: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
};
globals_1.jest.mock('../../src/logger', () => ({
    default: mockLogger,
}));
// Import the mocked module after mocking
const mockedTraceStore = globals_1.jest.requireMock('../../src/tracing/store');
(0, globals_1.describe)('OTLPReceiver', () => {
    let receiver;
    let mockTraceStore;
    (0, globals_1.beforeEach)(() => {
        // Reset mocks
        globals_1.jest.clearAllMocks();
        // Create mock trace store
        mockTraceStore = {
            createTrace: globals_1.jest.fn().mockResolvedValue(undefined),
            addSpans: globals_1.jest.fn().mockResolvedValue(undefined),
            getTracesByEvaluation: globals_1.jest.fn().mockResolvedValue([]),
            getTrace: globals_1.jest.fn().mockResolvedValue(null),
            deleteOldTraces: globals_1.jest.fn().mockResolvedValue(undefined),
        };
        // Mock the getTraceStore function
        mockedTraceStore.getTraceStore.mockReturnValue(mockTraceStore);
        // Create receiver instance
        receiver = new otlpReceiver_1.OTLPReceiver();
        // Manually override the traceStore property
        receiver.traceStore = mockTraceStore;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)('Health check', () => {
        (0, globals_1.it)('should respond to health check endpoint', async () => {
            const response = await (0, supertest_1.default)(receiver.getApp()).get('/health').expect(200);
            (0, globals_1.expect)(response.body).toEqual({ status: 'ok' });
        });
    });
    (0, globals_1.describe)('Service info', () => {
        (0, globals_1.it)('should provide service information', async () => {
            const response = await (0, supertest_1.default)(receiver.getApp()).get('/v1/traces').expect(200);
            (0, globals_1.expect)(response.body).toEqual({
                service: 'promptfoo-otlp-receiver',
                version: '1.0.0',
                supported_formats: ['json'],
            });
        });
    });
    (0, globals_1.describe)('Trace ingestion', () => {
        (0, globals_1.it)('should accept valid OTLP JSON traces', async () => {
            const otlpRequest = {
                resourceSpans: [
                    {
                        resource: {
                            attributes: [
                                { key: 'service.name', value: { stringValue: 'test-service' } },
                                { key: 'service.version', value: { stringValue: '1.0.0' } },
                            ],
                        },
                        scopeSpans: [
                            {
                                scope: {
                                    name: 'test-tracer',
                                    version: '1.0.0',
                                },
                                spans: [
                                    {
                                        traceId: Buffer.from('12345678901234567890123456789012', 'hex').toString('base64'),
                                        spanId: Buffer.from('1234567890123456', 'hex').toString('base64'),
                                        name: 'test-span',
                                        kind: 1,
                                        startTimeUnixNano: '1700000000000000000',
                                        endTimeUnixNano: '1700000001000000000',
                                        attributes: [
                                            { key: 'test.attribute', value: { stringValue: 'test-value' } },
                                            { key: 'test.count', value: { intValue: '42' } },
                                        ],
                                        status: {
                                            code: 0,
                                            message: 'OK',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            const response = await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send(otlpRequest);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toEqual({ partialSuccess: {} });
            // Verify spans were stored
            (0, globals_1.expect)(mockTraceStore.addSpans).toHaveBeenCalledWith('12345678901234567890123456789012', globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({
                    spanId: '1234567890123456',
                    name: 'test-span',
                    startTime: 1700000000000,
                    endTime: 1700000001000,
                    attributes: globals_1.expect.objectContaining({
                        'service.name': 'test-service',
                        'service.version': '1.0.0',
                        'test.attribute': 'test-value',
                        'test.count': 42,
                        'otel.scope.name': 'test-tracer',
                        'otel.scope.version': '1.0.0',
                    }),
                    statusCode: 0,
                    statusMessage: 'OK',
                }),
            ]), { skipTraceCheck: true });
        });
        (0, globals_1.it)('should handle multiple spans in a single request', async () => {
            // Manually override the traceStore property for this test too
            receiver.traceStore = mockTraceStore;
            const otlpRequest = {
                resourceSpans: [
                    {
                        scopeSpans: [
                            {
                                spans: [
                                    {
                                        traceId: Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex').toString('base64'),
                                        spanId: Buffer.from('1111111111111111', 'hex').toString('base64'),
                                        name: 'span-1',
                                        startTimeUnixNano: '1000000000',
                                    },
                                    {
                                        traceId: Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex').toString('base64'),
                                        spanId: Buffer.from('2222222222222222', 'hex').toString('base64'),
                                        parentSpanId: Buffer.from('1111111111111111', 'hex').toString('base64'),
                                        name: 'span-2',
                                        startTimeUnixNano: '2000000000',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send(otlpRequest)
                .expect(200);
            (0, globals_1.expect)(mockTraceStore.addSpans).toHaveBeenCalledWith('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({
                    spanId: '1111111111111111',
                    name: 'span-1',
                }),
                globals_1.expect.objectContaining({
                    spanId: '2222222222222222',
                    parentSpanId: '1111111111111111',
                    name: 'span-2',
                }),
            ]), { skipTraceCheck: true });
        });
        (0, globals_1.it)('should parse different attribute types', async () => {
            // Manually override the traceStore property for this test too
            receiver.traceStore = mockTraceStore;
            const otlpRequest = {
                resourceSpans: [
                    {
                        scopeSpans: [
                            {
                                spans: [
                                    {
                                        traceId: Buffer.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'hex').toString('base64'),
                                        spanId: Buffer.from('3333333333333333', 'hex').toString('base64'),
                                        name: 'test-attributes',
                                        startTimeUnixNano: '1000000000',
                                        attributes: [
                                            { key: 'string.attr', value: { stringValue: 'hello' } },
                                            { key: 'int.attr', value: { intValue: '123' } },
                                            { key: 'double.attr', value: { doubleValue: 3.14 } },
                                            { key: 'bool.attr', value: { boolValue: true } },
                                            {
                                                key: 'array.attr',
                                                value: {
                                                    arrayValue: {
                                                        values: [{ stringValue: 'a' }, { stringValue: 'b' }],
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send(otlpRequest)
                .expect(200);
            (0, globals_1.expect)(mockTraceStore.addSpans).toHaveBeenCalledWith('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({
                    attributes: globals_1.expect.objectContaining({
                        'string.attr': 'hello',
                        'int.attr': 123,
                        'double.attr': 3.14,
                        'bool.attr': true,
                        'array.attr': ['a', 'b'],
                    }),
                }),
            ]), { skipTraceCheck: true });
        });
        (0, globals_1.it)('should reject unsupported content types', async () => {
            const response = await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'text/plain')
                .send('invalid data')
                .expect(415);
            (0, globals_1.expect)(response.body).toEqual({ error: 'Unsupported content type' });
        });
        (0, globals_1.it)('should handle protobuf format with appropriate message', async () => {
            const response = await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/x-protobuf')
                .send(Buffer.from('dummy protobuf data'))
                .expect(415);
            (0, globals_1.expect)(response.body).toEqual({ error: 'Protobuf format not yet supported' });
        });
        (0, globals_1.it)('should handle malformed JSON gracefully', async () => {
            const response = await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send('{ invalid json')
                .expect(400);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should handle trace store errors gracefully', async () => {
            mockTraceStore.addSpans.mockRejectedValueOnce(new Error('Database error'));
            const otlpRequest = {
                resourceSpans: [
                    {
                        scopeSpans: [
                            {
                                spans: [
                                    {
                                        traceId: Buffer.from('cccccccccccccccccccccccccccccccc', 'hex').toString('base64'),
                                        spanId: Buffer.from('4444444444444444', 'hex').toString('base64'),
                                        name: 'error-span',
                                        startTimeUnixNano: '1000000000',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            const response = await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send(otlpRequest)
                .expect(500);
            (0, globals_1.expect)(response.body).toEqual({ error: 'Internal server error' });
        });
    });
    (0, globals_1.describe)('Base64 to hex conversion', () => {
        (0, globals_1.it)('should correctly convert base64 trace IDs to hex', async () => {
            // Manually override the traceStore property for this test too
            receiver.traceStore = mockTraceStore;
            const traceIdHex = 'deadbeefdeadbeefdeadbeefdeadbeef';
            const traceIdBase64 = Buffer.from(traceIdHex, 'hex').toString('base64');
            const otlpRequest = {
                resourceSpans: [
                    {
                        scopeSpans: [
                            {
                                spans: [
                                    {
                                        traceId: traceIdBase64,
                                        spanId: Buffer.from('1234567890abcdef', 'hex').toString('base64'),
                                        name: 'test-conversion',
                                        startTimeUnixNano: '1000000000',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            await (0, supertest_1.default)(receiver.getApp())
                .post('/v1/traces')
                .set('Content-Type', 'application/json')
                .send(otlpRequest)
                .expect(200);
            (0, globals_1.expect)(mockTraceStore.addSpans).toHaveBeenCalledWith(traceIdHex, globals_1.expect.any(Array), {
                skipTraceCheck: true,
            });
        });
    });
});
//# sourceMappingURL=otlpReceiver.test.js.map