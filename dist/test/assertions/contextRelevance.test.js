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
const contextRelevance_1 = require("../../src/assertions/contextRelevance");
const contextUtils = __importStar(require("../../src/assertions/contextUtils"));
const matchers_1 = require("../../src/matchers");
jest.mock('../../src/matchers');
jest.mock('../../src/assertions/contextUtils');
describe('handleContextRelevance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should pass when context relevance is above threshold', async () => {
        const mockResult = {
            pass: true,
            score: 0.9,
            reason: 'Context is highly relevant',
            metadata: {
                extractedSentences: ['Paris is the capital.'],
                totalContextSentences: 2,
                relevantSentenceCount: 1,
                insufficientInformation: false,
                score: 0.5,
            },
        };
        jest.mocked(matchers_1.matchesContextRelevance).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const result = await (0, contextRelevance_1.handleContextRelevance)({
            assertion: {
                type: 'context-relevance',
                threshold: 0.8,
            },
            test: {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'France is a country in Europe. Paris is the capital.',
                },
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {
                    query: 'What is the capital of France?',
                    context: 'France is a country in Europe. Paris is the capital.',
                },
                test: {
                    vars: {
                        query: 'What is the capital of France?',
                        context: 'France is a country in Europe. Paris is the capital.',
                    },
                    options: {},
                },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: { output: 'out', tokenUsage: {} },
        });
        expect(result.pass).toBe(true);
        expect(result.score).toBe(0.9);
        expect(result.reason).toBe('Context is highly relevant');
        expect(result.metadata).toEqual({
            context: 'test context',
            extractedSentences: ['Paris is the capital.'],
            totalContextSentences: 2,
            relevantSentenceCount: 1,
            insufficientInformation: false,
            score: 0.5,
        });
        expect(matchers_1.matchesContextRelevance).toHaveBeenCalledWith('What is the capital of France?', 'test context', 0.8, {}, undefined);
    });
    it('should fail when context relevance is below threshold', async () => {
        const mockResult = {
            pass: false,
            score: 0.3,
            reason: 'Context not relevant to query',
            metadata: {
                extractedSentences: [],
                totalContextSentences: 1,
                relevantSentenceCount: 0,
                insufficientInformation: true,
                score: 0,
            },
        };
        jest.mocked(matchers_1.matchesContextRelevance).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('irrelevant context');
        const result = await (0, contextRelevance_1.handleContextRelevance)({
            assertion: {
                type: 'context-relevance',
                threshold: 0.7,
            },
            test: {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Information about weather patterns in Australia.',
                },
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Information about weather patterns in Australia.',
                },
                test: {
                    vars: {
                        query: 'What is the capital of France?',
                        context: 'Information about weather patterns in Australia.',
                    },
                    options: {},
                },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: { output: 'out', tokenUsage: {} },
        });
        expect(result.pass).toBe(false);
        expect(result.score).toBe(0.3);
        expect(result.reason).toBe('Context not relevant to query');
        expect(result.metadata).toEqual({
            context: 'irrelevant context',
            extractedSentences: [],
            totalContextSentences: 1,
            relevantSentenceCount: 0,
            insufficientInformation: true,
            score: 0,
        });
        expect(matchers_1.matchesContextRelevance).toHaveBeenCalledWith('What is the capital of France?', 'irrelevant context', 0.7, {}, undefined);
    });
    it('should use default threshold of 0 when not provided', async () => {
        const mockResult = { pass: true, score: 1, reason: 'Perfect relevance' };
        jest.mocked(matchers_1.matchesContextRelevance).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const result = await (0, contextRelevance_1.handleContextRelevance)({
            assertion: {
                type: 'context-relevance',
            },
            test: {
                vars: {
                    query: 'test query',
                    context: 'test context',
                },
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { query: 'test query', context: 'test context' },
                test: { vars: { query: 'test query', context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: { output: 'out', tokenUsage: {} },
        });
        expect(matchers_1.matchesContextRelevance).toHaveBeenCalledWith('test query', 'test context', 0, {}, undefined);
        expect(result.metadata).toEqual({
            context: 'test context',
        });
    });
    it('should throw error when test.vars is missing', async () => {
        await expect((0, contextRelevance_1.handleContextRelevance)({
            assertion: { type: 'context-relevance' },
            test: {
                vars: undefined,
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {},
                test: { vars: undefined, options: {} },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: { output: 'out', tokenUsage: {} },
        })).rejects.toThrow('context-relevance assertion requires a test with variables');
    });
    it('should throw error when query is missing', async () => {
        await expect((0, contextRelevance_1.handleContextRelevance)({
            assertion: { type: 'context-relevance' },
            test: {
                vars: {
                    context: 'test context',
                },
                options: {},
            },
            output: 'test output',
            prompt: 'test prompt',
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { context: 'test context' },
                test: { vars: { context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            outputString: 'test output',
            providerResponse: { output: 'out', tokenUsage: {} },
        })).rejects.toThrow('context-relevance assertion requires a "query" variable with the user question');
    });
    it('should use contextTransform when provided', async () => {
        const mockResult = { pass: true, score: 1, reason: 'ok' };
        jest.mocked(matchers_1.matchesContextRelevance).mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('cx');
        const result = await (0, contextRelevance_1.handleContextRelevance)({
            assertion: {
                type: 'context-relevance',
                contextTransform: 'expr',
            },
            test: {
                vars: { query: 'q' },
                options: {},
            },
            baseType: 'context-relevance',
            assertionValueContext: {
                prompt: 'p',
                vars: {},
                test: { vars: { query: 'q' }, options: {} },
                logProbs: undefined,
                provider: { id: () => 'id', config: {}, callApi: jest.fn() },
                providerResponse: { output: 'out', tokenUsage: {} },
            },
            inverse: false,
            prompt: 'p',
            output: 'out',
            outputString: 'out',
            providerResponse: { output: 'out', tokenUsage: {} },
        });
        expect(contextUtils.resolveContext).toHaveBeenCalledWith({ type: 'context-relevance', contextTransform: 'expr' }, { vars: { query: 'q' }, options: {} }, 'out', 'p', undefined, { output: 'out', tokenUsage: {} });
        expect(matchers_1.matchesContextRelevance).toHaveBeenCalledWith('q', 'cx', 0, {}, undefined);
        expect(result.metadata).toEqual({
            context: 'cx',
        });
    });
});
//# sourceMappingURL=contextRelevance.test.js.map