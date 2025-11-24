"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const evaluator_1 = require("../src/evaluator");
const eval_1 = __importDefault(require("../src/models/eval"));
// Mock the transform function to track calls
globals_1.jest.mock('../src/util/transform', () => ({
    transform: globals_1.jest.fn(),
    TransformInputType: {
        OUTPUT: 'output',
        VARS: 'vars',
    },
}));
// Mock assertions to prevent timeouts
globals_1.jest.mock('../src/assertions', () => ({
    runAssertions: globals_1.jest.fn(() => Promise.resolve({
        pass: true,
        score: 1,
        namedScores: {},
    })),
}));
// Mock cache to prevent file system operations
globals_1.jest.mock('../src/cache', () => ({
    getCache: globals_1.jest.fn(() => ({
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        wrap: globals_1.jest.fn((_key, fn) => fn()),
    })),
}));
// Mock logger to prevent console output during tests
globals_1.jest.mock('../src/logger', () => ({
    default: {
        debug: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
    },
}));
// Mock file operations
globals_1.jest.mock('../src/util/file', () => ({
    readFileCached: globals_1.jest.fn(() => Promise.resolve('')),
}));
// Mock evaluator helpers
globals_1.jest.mock('../src/evaluatorHelpers', () => {
    const actual = globals_1.jest.requireActual('../src/evaluatorHelpers');
    return {
        ...actual,
        runExtensionHook: globals_1.jest.fn((...args) => args[2]),
    };
});
// Mock time utilities
globals_1.jest.mock('../src/util/time', () => {
    const actual = globals_1.jest.requireActual('../src/util/time');
    return {
        ...actual,
        sleep: globals_1.jest.fn(() => Promise.resolve()),
    };
});
// Mock ESM
globals_1.jest.mock('../src/esm', () => ({}));
const mockTransform = globals_1.jest.requireMock('../src/util/transform')
    .transform;
(0, globals_1.describe)('Transformation integration', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    globals_1.it.skip('should apply test.options.transform and assert.contextTransform from provider output', async () => {
        // Track the transformation sequence
        const transformCalls = [];
        mockTransform.mockImplementation(async (expression, input) => {
            transformCalls.push({ expression, input });
            if (expression === 'output.toUpperCase()') {
                // Provider transform
                return 'PROVIDER TRANSFORMED';
            }
            else if (expression === 'output + " - test transformed"') {
                // Test transform - should receive provider output
                return input + ' - test transformed';
            }
            else if (expression === 'output.split(" ")[0]') {
                // Context transform - should also receive provider output
                return String(input).split(' ')[0];
            }
            return input;
        });
        const testSuite = {
            prompts: [{ raw: 'Test prompt', label: 'Test' }],
            providers: [
                {
                    id: () => 'mock-provider',
                    callApi: async () => ({
                        output: 'original output',
                        tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                    }),
                    transform: 'output.toUpperCase()',
                },
            ],
            tests: [
                {
                    vars: {
                        query: 'test query',
                        context: 'test context',
                    },
                    assert: [
                        {
                            type: 'equals',
                            value: 'PROVIDER TRANSFORMED - test transformed',
                        },
                        {
                            type: 'context-faithfulness',
                            contextTransform: 'output.split(" ")[0]',
                        },
                    ],
                    options: {
                        transform: 'output + " - test transformed"',
                    },
                },
            ],
        };
        const evalRecord = new eval_1.default({});
        const results = await (0, evaluator_1.evaluate)(testSuite, evalRecord, { maxConcurrency: 1 });
        // Check that both test transform and context transform received provider output
        const testTransformCall = transformCalls.find((c) => c.expression === 'output + " - test transformed"');
        const contextTransformCall = transformCalls.find((c) => c.expression === 'output.split(" ")[0]');
        (0, globals_1.expect)(testTransformCall?.input).toBe('PROVIDER TRANSFORMED');
        (0, globals_1.expect)(contextTransformCall?.input).toBe('PROVIDER TRANSFORMED');
        // The final output should have the test transform applied
        (0, globals_1.expect)(results.results[0].response?.output).toBe('PROVIDER TRANSFORMED - test transformed');
        // Context transform should have extracted first word from provider output
        (0, globals_1.expect)(contextTransformCall?.input).toBe('PROVIDER TRANSFORMED');
    });
    globals_1.it.skip('should handle multiple context transforms', async () => {
        const transformCalls = [];
        mockTransform.mockImplementation(async (expression, input) => {
            transformCalls.push({ expression, input, timestamp: Date.now() });
            if (expression === 'JSON.stringify({provider: output})') {
                // Provider transform
                return JSON.stringify({ provider: input });
            }
            else if (expression === 'JSON.parse(output).provider.toLowerCase()') {
                // Test transform
                const parsed = typeof input === 'string' ? JSON.parse(input) : input;
                return parsed.provider.toLowerCase();
            }
            else if (expression.startsWith('JSON.parse(output)')) {
                // Context transforms - all should receive provider output
                if (typeof input === 'string') {
                    JSON.parse(input); // Validate that input is valid JSON
                }
                if (expression.includes('context1')) {
                    return 'context1 from provider';
                }
                if (expression.includes('context2')) {
                    return 'context2 from provider';
                }
                if (expression.includes('context3')) {
                    return 'context3 from provider';
                }
            }
            return input;
        });
        const testSuite = {
            prompts: [{ raw: 'Test prompt', label: 'Test' }],
            providers: [
                {
                    id: () => 'mock-provider',
                    callApi: async () => ({
                        output: 'ORIGINAL',
                        tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                    }),
                    transform: 'JSON.stringify({provider: output})',
                },
            ],
            tests: [
                {
                    vars: {
                        query: 'test query',
                    },
                    assert: [
                        {
                            type: 'context-faithfulness',
                            contextTransform: 'JSON.parse(output).context1',
                        },
                        {
                            type: 'context-recall',
                            contextTransform: 'JSON.parse(output).context2',
                        },
                        {
                            type: 'context-relevance',
                            contextTransform: 'JSON.parse(output).context3',
                        },
                    ],
                    options: {
                        transform: 'JSON.parse(output).provider.toLowerCase()',
                    },
                },
            ],
        };
        const evalRecord = new eval_1.default({});
        await (0, evaluator_1.evaluate)(testSuite, evalRecord, { maxConcurrency: 1 });
        // All context transforms should receive the same provider-transformed output
        const contextTransforms = transformCalls.filter((c) => c.expression.includes('context1') ||
            c.expression.includes('context2') ||
            c.expression.includes('context3'));
        // All should have received the JSON stringified provider output
        contextTransforms.forEach((call) => {
            (0, globals_1.expect)(call.input).toBe('{"provider":"ORIGINAL"}');
        });
        // Test transform should also receive provider output
        const testTransform = transformCalls.find((c) => c.expression.includes('toLowerCase'));
        (0, globals_1.expect)(testTransform?.input).toBe('{"provider":"ORIGINAL"}');
    });
    (0, globals_1.it)('should work correctly with only provider transform', async () => {
        mockTransform.mockImplementation(async (expression, input) => {
            if (expression === 'output.trim().toUpperCase()') {
                return String(input).trim().toUpperCase();
            }
            return input;
        });
        const testSuite = {
            prompts: [{ raw: 'Test prompt', label: 'Test' }],
            providers: [
                {
                    id: () => 'mock-provider',
                    callApi: async () => ({
                        output: '  spaced output  ',
                        tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                    }),
                    transform: 'output.trim().toUpperCase()',
                },
            ],
            tests: [
                {
                    assert: [
                        {
                            type: 'equals',
                            value: 'SPACED OUTPUT',
                        },
                    ],
                },
            ],
        };
        const evalRecord = new eval_1.default({});
        const results = await (0, evaluator_1.evaluate)(testSuite, evalRecord, { maxConcurrency: 1 });
        (0, globals_1.expect)(results.results[0].response?.output).toBe('SPACED OUTPUT');
    });
    globals_1.it.skip('should maintain backwards compatibility when contextTransform is used without test transform', async () => {
        const transformCalls = [];
        mockTransform.mockImplementation(async (expression, input) => {
            transformCalls.push({ expression, input });
            if (expression === 'output.metadata') {
                // Should receive provider output directly when no test transform
                return { extracted: 'metadata' };
            }
            return input;
        });
        const testSuite = {
            prompts: [{ raw: 'Test prompt', label: 'Test' }],
            providers: [
                {
                    id: () => 'mock-provider',
                    callApi: async () => ({
                        output: { data: 'test', metadata: { extracted: 'metadata' } },
                        tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                    }),
                },
            ],
            tests: [
                {
                    vars: { query: 'test' },
                    assert: [
                        {
                            type: 'context-faithfulness',
                            contextTransform: 'output.metadata',
                        },
                    ],
                },
            ],
        };
        const evalRecord = new eval_1.default({});
        await (0, evaluator_1.evaluate)(testSuite, evalRecord, { maxConcurrency: 1 });
        const contextTransformCall = transformCalls.find((call) => call.expression === 'output.metadata');
        // Should receive the raw provider output
        (0, globals_1.expect)(contextTransformCall?.input).toEqual({
            data: 'test',
            metadata: { extracted: 'metadata' },
        });
    });
});
//# sourceMappingURL=evaluator.integration.transforms.test.js.map