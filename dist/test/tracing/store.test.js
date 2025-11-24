"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock crypto module BEFORE importing TraceStore
const mockRandomUUID = globals_1.jest.fn(() => 'test-uuid');
globals_1.jest.doMock('crypto', () => ({
    ...globals_1.jest.requireActual('crypto'),
    randomUUID: mockRandomUUID,
}));
// Dynamic import after mocking
let TraceStore;
(0, globals_1.describe)('TraceStore', () => {
    let traceStore;
    let mockDb;
    (0, globals_1.beforeEach)(async () => {
        // Reset the UUID mock
        mockRandomUUID.mockReturnValue('test-uuid');
        // Dynamic import after mocking
        if (!TraceStore) {
            const module = await Promise.resolve().then(() => __importStar(require('../../src/tracing/store')));
            TraceStore = module.TraceStore;
        }
        // Create mock database methods that properly chain
        const mockInsertChain = {
            values: globals_1.jest.fn().mockReturnThis(),
            onConflictDoNothing: globals_1.jest.fn(() => Promise.resolve(undefined)),
        };
        const mockSelectChain = {
            from: globals_1.jest.fn().mockReturnThis(),
            where: globals_1.jest.fn().mockReturnThis(),
            limit: globals_1.jest.fn(() => Promise.resolve([])),
        };
        const mockDeleteChain = {
            where: globals_1.jest.fn(() => Promise.resolve(undefined)),
        };
        mockDb = {
            insert: globals_1.jest.fn(() => mockInsertChain),
            select: globals_1.jest.fn(() => mockSelectChain),
            delete: globals_1.jest.fn(() => mockDeleteChain),
        };
        // Create trace store and inject mock DB
        traceStore = new TraceStore();
        // Use private property access to inject the mock
        traceStore.db = mockDb;
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('createTrace', () => {
        (0, globals_1.it)('should create a new trace record', async () => {
            const traceData = {
                traceId: 'test-trace-id',
                evaluationId: 'test-eval-id',
                testCaseId: 'test-case-id',
                metadata: { test: 'data' },
            };
            await traceStore.createTrace(traceData);
            (0, globals_1.expect)(mockDb.insert).toHaveBeenCalledWith(globals_1.expect.anything());
            (0, globals_1.expect)(mockDb.insert().values).toHaveBeenCalledWith({
                id: 'test-uuid',
                traceId: 'test-trace-id',
                evaluationId: 'test-eval-id',
                testCaseId: 'test-case-id',
                metadata: { test: 'data' },
            });
            (0, globals_1.expect)(mockDb.insert().values().onConflictDoNothing).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                target: globals_1.expect.anything(),
            }));
        });
        (0, globals_1.it)('should handle errors when creating trace', async () => {
            const error = new Error('Database error');
            mockDb.insert().values().onConflictDoNothing.mockRejectedValueOnce(error);
            const traceData = {
                traceId: 'test-trace-id',
                evaluationId: 'test-eval-id',
                testCaseId: 'test-case-id',
            };
            await (0, globals_1.expect)(traceStore.createTrace(traceData)).rejects.toThrow('Database error');
        });
    });
    (0, globals_1.describe)('addSpans', () => {
        (0, globals_1.it)('should add spans to an existing trace', async () => {
            // Mock trace exists check
            mockDb
                .select()
                .from()
                .where()
                .limit.mockResolvedValueOnce([{ traceId: 'test-trace-id' }]);
            const spans = [
                {
                    spanId: 'span-1',
                    name: 'operation-1',
                    startTime: 1000,
                    endTime: 2000,
                    attributes: { key: 'value' },
                },
                {
                    spanId: 'span-2',
                    parentSpanId: 'span-1',
                    name: 'operation-2',
                    startTime: 1100,
                    endTime: 1900,
                    statusCode: 0,
                    statusMessage: 'OK',
                },
            ];
            await traceStore.addSpans('test-trace-id', spans);
            (0, globals_1.expect)(mockDb.select).toHaveBeenCalledWith();
            (0, globals_1.expect)(mockDb.select().from).toHaveBeenCalledWith(globals_1.expect.anything());
            (0, globals_1.expect)(mockDb.select().from().where).toHaveBeenCalledWith(globals_1.expect.anything());
            (0, globals_1.expect)(mockDb.insert).toHaveBeenCalledWith(globals_1.expect.anything());
            (0, globals_1.expect)(mockDb.insert().values).toHaveBeenCalledWith([
                {
                    id: 'test-uuid',
                    traceId: 'test-trace-id',
                    spanId: 'span-1',
                    parentSpanId: undefined,
                    name: 'operation-1',
                    startTime: 1000,
                    endTime: 2000,
                    attributes: { key: 'value' },
                    statusCode: undefined,
                    statusMessage: undefined,
                },
                {
                    id: 'test-uuid',
                    traceId: 'test-trace-id',
                    spanId: 'span-2',
                    parentSpanId: 'span-1',
                    name: 'operation-2',
                    startTime: 1100,
                    endTime: 1900,
                    attributes: undefined,
                    statusCode: 0,
                    statusMessage: 'OK',
                },
            ]);
        });
        (0, globals_1.it)('should skip spans if trace does not exist', async () => {
            // Mock trace does not exist
            mockDb.select().from().where().limit.mockResolvedValueOnce([]);
            const spans = [
                {
                    spanId: 'span-1',
                    name: 'operation-1',
                    startTime: 1000,
                },
            ];
            await traceStore.addSpans('non-existent-trace', spans);
            // Should check for trace existence
            (0, globals_1.expect)(mockDb.select).toHaveBeenCalledWith();
            // Should not insert spans
            (0, globals_1.expect)(mockDb.insert).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle errors when adding spans', async () => {
            // Mock trace exists
            mockDb
                .select()
                .from()
                .where()
                .limit.mockResolvedValueOnce([{ traceId: 'test-trace-id' }]);
            // Mock insert error
            const error = new Error('Insert failed');
            mockDb.insert().values.mockRejectedValueOnce(error);
            const spans = [
                {
                    spanId: 'span-1',
                    name: 'operation-1',
                    startTime: 1000,
                },
            ];
            await (0, globals_1.expect)(traceStore.addSpans('test-trace-id', spans)).rejects.toThrow('Insert failed');
        });
    });
    (0, globals_1.describe)('getTracesByEvaluation', () => {
        (0, globals_1.it)('should retrieve all traces for an evaluation', async () => {
            const mockTraces = [
                { id: '1', traceId: 'trace-1', evaluationId: 'eval-1' },
                { id: '2', traceId: 'trace-2', evaluationId: 'eval-1' },
            ];
            const mockSpans = {
                'trace-1': [
                    { id: '1', traceId: 'trace-1', spanId: 'span-1-1' },
                    { id: '2', traceId: 'trace-1', spanId: 'span-1-2' },
                ],
                'trace-2': [{ id: '3', traceId: 'trace-2', spanId: 'span-2-1' }],
            };
            // Set up the main traces query
            const tracesSelectChain = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn(() => Promise.resolve(mockTraces)),
            };
            // Set up span queries for each trace
            const spanQuery1 = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn(() => Promise.resolve(mockSpans['trace-1'])),
            };
            const spanQuery2 = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn(() => Promise.resolve(mockSpans['trace-2'])),
            };
            // Mock the select calls in sequence: first for traces, then for each trace's spans
            globals_1.jest
                .spyOn(mockDb, 'select')
                .mockImplementation(() => ({}))
                .mockReturnValueOnce(tracesSelectChain)
                .mockReturnValueOnce(spanQuery1)
                .mockReturnValueOnce(spanQuery2);
            const result = await traceStore.getTracesByEvaluation('eval-1');
            (0, globals_1.expect)(result).toHaveLength(2);
            (0, globals_1.expect)(result[0]).toEqual({
                ...mockTraces[0],
                spans: mockSpans['trace-1'],
            });
            (0, globals_1.expect)(result[1]).toEqual({
                ...mockTraces[1],
                spans: mockSpans['trace-2'],
            });
        });
        (0, globals_1.it)('should return empty array if no traces found', async () => {
            mockDb.select().from().where.mockResolvedValueOnce([]);
            const result = await traceStore.getTracesByEvaluation('non-existent-eval');
            (0, globals_1.expect)(result).toEqual([]);
        });
    });
    (0, globals_1.describe)('getTrace', () => {
        (0, globals_1.it)('should retrieve a single trace with spans', async () => {
            const mockTrace = { id: '1', traceId: 'trace-1', evaluationId: 'eval-1' };
            const mockSpans = [
                { id: '1', traceId: 'trace-1', spanId: 'span-1' },
                { id: '2', traceId: 'trace-1', spanId: 'span-2' },
            ];
            // Mock trace query - update the select chain to include limit
            const traceSelectChain = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn().mockReturnThis(),
                limit: globals_1.jest.fn(() => Promise.resolve([mockTrace])),
            };
            // Mock spans query
            const spanQuery = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn(() => Promise.resolve(mockSpans)),
            };
            globals_1.jest
                .spyOn(mockDb, 'select')
                .mockImplementation(() => ({}))
                .mockReturnValueOnce(traceSelectChain)
                .mockReturnValueOnce(spanQuery);
            const result = await traceStore.getTrace('trace-1');
            (0, globals_1.expect)(result).toEqual({
                ...mockTrace,
                spans: mockSpans,
            });
        });
        (0, globals_1.it)('should return null if trace not found', async () => {
            // Mock trace query - update the select chain to include limit
            const traceSelectChain = {
                from: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn().mockReturnThis(),
                limit: globals_1.jest.fn(() => Promise.resolve([])),
            };
            globals_1.jest
                .spyOn(mockDb, 'select')
                .mockImplementation(() => ({}))
                .mockReturnValue(traceSelectChain);
            const result = await traceStore.getTrace('non-existent-trace');
            (0, globals_1.expect)(result).toBeNull();
        });
    });
    (0, globals_1.describe)('deleteOldTraces', () => {
        (0, globals_1.it)('should delete traces older than retention period', async () => {
            const retentionDays = 30;
            await traceStore.deleteOldTraces(retentionDays);
            (0, globals_1.expect)(mockDb.delete).toHaveBeenCalledWith(globals_1.expect.anything());
            (0, globals_1.expect)(mockDb.delete().where).toHaveBeenCalledWith(globals_1.expect.anything());
        });
        (0, globals_1.it)('should handle errors when deleting old traces', async () => {
            const error = new Error('Delete failed');
            mockDb.delete().where.mockRejectedValueOnce(error);
            await (0, globals_1.expect)(traceStore.deleteOldTraces(30)).rejects.toThrow('Delete failed');
        });
    });
});
//# sourceMappingURL=store.test.js.map