"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const store_1 = require("../../src/tracing/store");
// Mock the entire database module
globals_1.jest.mock('../../src/database', () => ({
    getDb: globals_1.jest.fn(),
}));
// Mock the crypto module
globals_1.jest.mock('crypto', () => ({
    randomUUID: globals_1.jest.fn(() => 'test-uuid'),
}));
// Mock logger
globals_1.jest.mock('../../src/logger', () => ({
    default: {
        debug: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)('TraceStore (Simple)', () => {
    let traceStore;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        // Create a new instance for each test
        traceStore = new store_1.TraceStore();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.it)('should be instantiable', () => {
        (0, globals_1.expect)(traceStore).toBeInstanceOf(store_1.TraceStore);
    });
    (0, globals_1.it)('should have all required methods', () => {
        (0, globals_1.expect)(traceStore.createTrace).toBeDefined();
        (0, globals_1.expect)(traceStore.addSpans).toBeDefined();
        (0, globals_1.expect)(traceStore.getTracesByEvaluation).toBeDefined();
        (0, globals_1.expect)(traceStore.getTrace).toBeDefined();
        (0, globals_1.expect)(traceStore.deleteOldTraces).toBeDefined();
    });
});
//# sourceMappingURL=store.simple.test.js.map