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
const contextFaithfulness_1 = require("../../src/assertions/contextFaithfulness");
const contextUtils = __importStar(require("../../src/assertions/contextUtils"));
const matchers = __importStar(require("../../src/matchers"));
jest.mock('../../src/matchers');
jest.mock('../../src/assertions/contextUtils');
describe('handleContextFaithfulness', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should pass when context faithfulness is above threshold', async () => {
        const mockResult = { pass: true, score: 0.9, reason: 'Content is faithful to context' };
        jest.mocked(matchers.matchesContextFaithfulness).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const result = await (0, contextFaithfulness_1.handleContextFaithfulness)({
            assertion: {
                type: 'context-faithfulness',
                threshold: 0.7,
            },
            test: {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
                options: {},
            },
            output: 'The capital of France is Paris.',
            prompt: 'test prompt',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
                test: {
                    vars: {
                        query: 'What is the capital of France?',
                        context: 'Paris is the capital of France.',
                    },
                    options: {},
                },
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: 'The capital of France is Paris.',
            providerResponse: null,
        });
        expect(result.pass).toBe(true);
        expect(result.score).toBe(0.9);
        expect(result.reason).toBe('Content is faithful to context');
        expect(result.metadata).toBeDefined();
        expect(result.metadata.context).toBe('test context');
        expect(matchers.matchesContextFaithfulness).toHaveBeenCalledWith('What is the capital of France?', 'The capital of France is Paris.', 'test context', 0.7, {}, expect.any(Object), undefined);
    });
    it('should fail when context faithfulness is below threshold', async () => {
        const mockResult = { pass: false, score: 0.3, reason: 'Content contains hallucinations' };
        jest.mocked(matchers.matchesContextFaithfulness).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const result = await (0, contextFaithfulness_1.handleContextFaithfulness)({
            assertion: {
                type: 'context-faithfulness',
                threshold: 0.7,
            },
            test: {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
                options: {},
            },
            output: 'The capital of France is Paris and it has a population of 50 million.',
            prompt: 'test prompt',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
                test: {
                    vars: {
                        query: 'What is the capital of France?',
                        context: 'Paris is the capital of France.',
                    },
                    options: {},
                },
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: 'The capital of France is Paris and it has a population of 50 million.',
            providerResponse: null,
        });
        expect(result.pass).toBe(false);
        expect(result.score).toBe(0.3);
        expect(result.reason).toBe('Content contains hallucinations');
        expect(result.metadata).toBeDefined();
        expect(result.metadata.context).toBe('test context');
        expect(matchers.matchesContextFaithfulness).toHaveBeenCalledWith('What is the capital of France?', 'The capital of France is Paris and it has a population of 50 million.', 'test context', 0.7, {}, expect.any(Object), undefined);
    });
    it('should throw error when test.vars is undefined', async () => {
        await expect((0, contextFaithfulness_1.handleContextFaithfulness)({
            assertion: { type: 'context-faithfulness' },
            test: {
                vars: undefined,
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {},
                test: { vars: undefined, options: {} },
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: null,
        })).rejects.toThrow('context-faithfulness assertion requires a test with variables');
    });
    it('should throw error when query is not a string', async () => {
        await expect((0, contextFaithfulness_1.handleContextFaithfulness)({
            assertion: { type: 'context-faithfulness' },
            test: {
                vars: {
                    query: 123,
                },
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { query: 123 },
                test: { vars: { query: 123 }, options: {} },
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: null,
        })).rejects.toThrow('context-faithfulness assertion requires a "query" variable with the user question');
    });
    it('should throw error when output is not a string', async () => {
        await expect((0, contextFaithfulness_1.handleContextFaithfulness)({
            assertion: { type: 'context-faithfulness' },
            test: {
                vars: {
                    query: 'test query',
                },
                options: {},
            },
            output: 123,
            prompt: 'test prompt',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { query: 'test query' },
                test: { vars: { query: 'test query' }, options: {} },
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: '123',
            providerResponse: null,
        })).rejects.toThrow('context-faithfulness assertion requires string output from the provider');
    });
    it('should use contextTransform to extract context', async () => {
        const mockResult = { pass: true, score: 1, reason: 'ok' };
        jest.mocked(matchers.matchesContextFaithfulness).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('from-transform');
        const params = {
            assertion: {
                type: 'context-faithfulness',
                contextTransform: 'output.context',
            },
            test: {
                vars: {
                    query: 'test query',
                },
                options: {},
            },
            output: 'raw',
            prompt: 'prompt text',
            baseType: 'context-faithfulness',
            assertionValueContext: {
                prompt: 'prompt text',
                vars: {},
                test: {},
                logProbs: null,
                tokenUsage: null,
                cached: false,
                provider: null,
                providerResponse: null,
            },
            inverse: false,
            outputString: 'raw',
            providerResponse: null,
        };
        const result = await (0, contextFaithfulness_1.handleContextFaithfulness)(params);
        expect(contextUtils.resolveContext).toHaveBeenCalledWith(params.assertion, params.test, 'raw', 'prompt text', undefined, null);
        expect(matchers.matchesContextFaithfulness).toHaveBeenCalledWith('test query', 'raw', 'from-transform', 0, {}, expect.any(Object), undefined);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.context).toBe('from-transform');
    });
});
//# sourceMappingURL=contextFaithfulness.test.js.map