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
const answerRelevance_1 = require("../../src/assertions/answerRelevance");
const contextFaithfulness_1 = require("../../src/assertions/contextFaithfulness");
const contextRecall_1 = require("../../src/assertions/contextRecall");
const contextRelevance_1 = require("../../src/assertions/contextRelevance");
const factuality_1 = require("../../src/assertions/factuality");
const geval_1 = require("../../src/assertions/geval");
const index_1 = require("../../src/assertions/index");
const llmRubric_1 = require("../../src/assertions/llmRubric");
const modelGradedClosedQa_1 = require("../../src/assertions/modelGradedClosedQa");
const matchers_1 = require("../../src/matchers");
jest.mock('../../src/matchers');
jest.mock('../../src/assertions/contextUtils', () => ({
    resolveContext: jest.fn().mockResolvedValue('mocked context'),
}));
describe('Context Propagation in Model-Graded Assertions', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    const mockProvider = {
        id: () => 'test-provider',
        callApi: jest.fn(),
    };
    const mockCallApiContext = {
        originalProvider: mockProvider,
        prompt: { raw: 'test prompt', label: 'test' },
        vars: { testVar: 'value' },
    };
    const baseParams = {
        assertion: { type: 'llm-rubric' },
        baseType: 'llm-rubric',
        providerCallContext: mockCallApiContext,
        assertionValueContext: {
            prompt: 'test prompt',
            vars: { testVar: 'value' },
            test: { vars: { testVar: 'value' } },
            logProbs: undefined,
            provider: mockProvider,
            providerResponse: undefined,
        },
        inverse: false,
        output: 'test output',
        outputString: 'test output',
        prompt: 'test prompt',
        provider: mockProvider,
        providerResponse: {},
        test: { vars: { testVar: 'value' } },
    };
    describe('handleLlmRubric', () => {
        it('should pass callApiContext to matchesLlmRubric', async () => {
            const mockResult = { pass: true, score: 1, reason: 'test' };
            jest.mocked(matchers_1.matchesLlmRubric).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                renderedValue: 'test rubric',
            };
            await (0, llmRubric_1.handleLlmRubric)(params);
            expect(matchers_1.matchesLlmRubric).toHaveBeenCalledWith('test rubric', 'test output', undefined, { testVar: 'value' }, params.assertion, undefined, mockCallApiContext);
        });
        it('should work when callApiContext is undefined', async () => {
            const mockResult = { pass: true, score: 1, reason: 'test' };
            jest.mocked(matchers_1.matchesLlmRubric).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                providerCallContext: undefined,
                renderedValue: 'test rubric',
            };
            await (0, llmRubric_1.handleLlmRubric)(params);
            expect(matchers_1.matchesLlmRubric).toHaveBeenCalledWith('test rubric', 'test output', undefined, { testVar: 'value' }, params.assertion, undefined, undefined);
        });
    });
    describe('handleFactuality', () => {
        it('should pass callApiContext to matchesFactuality', async () => {
            const mockResult = { pass: true, score: 1, reason: 'test' };
            jest.mocked(matchers_1.matchesFactuality).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'factuality' },
                baseType: 'factuality',
                renderedValue: 'expected answer',
            };
            await (0, factuality_1.handleFactuality)(params);
            expect(matchers_1.matchesFactuality).toHaveBeenCalledWith('test prompt', 'expected answer', 'test output', undefined, { testVar: 'value' }, mockCallApiContext);
        });
    });
    describe('handleModelGradedClosedQa', () => {
        it('should pass callApiContext to matchesClosedQa', async () => {
            const mockResult = { pass: true, score: 1, reason: 'test' };
            jest.mocked(matchers_1.matchesClosedQa).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'model-graded-closedqa' },
                baseType: 'model-graded-closedqa',
                renderedValue: 'criteria',
            };
            await (0, modelGradedClosedQa_1.handleModelGradedClosedQa)(params);
            expect(matchers_1.matchesClosedQa).toHaveBeenCalledWith('test prompt', 'criteria', 'test output', undefined, { testVar: 'value' }, mockCallApiContext);
        });
    });
    describe('handleGEval', () => {
        it('should pass callApiContext to matchesGEval', async () => {
            const mockResult = { pass: true, score: 0.8, reason: 'test' };
            jest.mocked(matchers_1.matchesGEval).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'g-eval', threshold: 0.7 },
                baseType: 'g-eval',
                renderedValue: 'coherence criteria',
            };
            await (0, geval_1.handleGEval)(params);
            expect(matchers_1.matchesGEval).toHaveBeenCalledWith('coherence criteria', 'test prompt', 'test output', 0.7, undefined, mockCallApiContext);
        });
        it('should pass callApiContext when evaluating array of criteria', async () => {
            const mockResult = { pass: true, score: 0.8, reason: 'test' };
            jest.mocked(matchers_1.matchesGEval).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'g-eval', threshold: 0.7 },
                baseType: 'g-eval',
                renderedValue: ['coherence', 'relevance'],
            };
            await (0, geval_1.handleGEval)(params);
            expect(matchers_1.matchesGEval).toHaveBeenNthCalledWith(1, 'coherence', 'test prompt', 'test output', 0.7, undefined, mockCallApiContext);
            expect(matchers_1.matchesGEval).toHaveBeenNthCalledWith(2, 'relevance', 'test prompt', 'test output', 0.7, undefined, mockCallApiContext);
        });
    });
    describe('handleAnswerRelevance', () => {
        it('should pass callApiContext to matchesAnswerRelevance', async () => {
            const mockResult = { pass: true, score: 0.9, reason: 'test' };
            jest.mocked(matchers_1.matchesAnswerRelevance).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'answer-relevance', threshold: 0.8 },
                baseType: 'answer-relevance',
            };
            await (0, answerRelevance_1.handleAnswerRelevance)(params);
            expect(matchers_1.matchesAnswerRelevance).toHaveBeenCalledWith('test prompt', 'test output', 0.8, undefined, mockCallApiContext);
        });
        it('should use query variable if present', async () => {
            const mockResult = { pass: true, score: 0.9, reason: 'test' };
            jest.mocked(matchers_1.matchesAnswerRelevance).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'answer-relevance', threshold: 0.8 },
                baseType: 'answer-relevance',
                test: { vars: { query: 'custom query' } },
            };
            await (0, answerRelevance_1.handleAnswerRelevance)(params);
            expect(matchers_1.matchesAnswerRelevance).toHaveBeenCalledWith('custom query', 'test output', 0.8, undefined, mockCallApiContext);
        });
    });
    describe('handleContextRecall', () => {
        it('should pass callApiContext to matchesContextRecall', async () => {
            const { resolveContext } = await Promise.resolve().then(() => __importStar(require('../../src/assertions/contextUtils')));
            jest.mocked(resolveContext).mockResolvedValue('resolved context');
            const mockResult = { pass: true, score: 0.85, reason: 'test' };
            jest.mocked(matchers_1.matchesContextRecall).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'context-recall', threshold: 0.7 },
                baseType: 'context-recall',
                renderedValue: 'ground truth',
                providerResponse: { output: 'test' },
            };
            await (0, contextRecall_1.handleContextRecall)(params);
            expect(matchers_1.matchesContextRecall).toHaveBeenCalledWith('resolved context', 'ground truth', 0.7, undefined, { testVar: 'value' }, mockCallApiContext);
        });
    });
    describe('handleContextRelevance', () => {
        it('should pass callApiContext to matchesContextRelevance', async () => {
            const { resolveContext } = await Promise.resolve().then(() => __importStar(require('../../src/assertions/contextUtils')));
            jest.mocked(resolveContext).mockResolvedValue('resolved context');
            const mockResult = { pass: true, score: 0.9, reason: 'test' };
            jest.mocked(matchers_1.matchesContextRelevance).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'context-relevance', threshold: 0.8 },
                baseType: 'context-relevance',
                test: { vars: { query: 'user question' } },
                providerResponse: { output: 'test' },
            };
            await (0, contextRelevance_1.handleContextRelevance)(params);
            expect(matchers_1.matchesContextRelevance).toHaveBeenCalledWith('user question', 'resolved context', 0.8, undefined, mockCallApiContext);
        });
    });
    describe('handleContextFaithfulness', () => {
        it('should pass callApiContext to matchesContextFaithfulness', async () => {
            const { resolveContext } = await Promise.resolve().then(() => __importStar(require('../../src/assertions/contextUtils')));
            jest.mocked(resolveContext).mockResolvedValue('resolved context');
            const mockResult = { pass: true, score: 0.95, reason: 'test' };
            jest.mocked(matchers_1.matchesContextFaithfulness).mockResolvedValue(mockResult);
            const params = {
                ...baseParams,
                assertion: { type: 'context-faithfulness', threshold: 0.9 },
                baseType: 'context-faithfulness',
                test: { vars: { query: 'user question' } },
                providerResponse: { output: 'test' },
            };
            await (0, contextFaithfulness_1.handleContextFaithfulness)(params);
            expect(matchers_1.matchesContextFaithfulness).toHaveBeenCalledWith('user question', 'test output', 'resolved context', 0.9, undefined, { query: 'user question' }, mockCallApiContext);
        });
    });
    describe('runCompareAssertion (select-best)', () => {
        it('should pass callApiContext to matchesSelectBest', async () => {
            const mockResult = [
                { pass: true, score: 1, reason: 'best' },
                { pass: false, score: 0, reason: 'not best' },
            ];
            jest.mocked(matchers_1.matchesSelectBest).mockResolvedValue(mockResult);
            const test = { vars: { testVar: 'value' }, options: { provider: 'test-provider' } };
            const assertion = { type: 'select-best', value: 'test criteria' };
            const outputs = ['output1', 'output2'];
            await (0, index_1.runCompareAssertion)(test, assertion, outputs, mockCallApiContext);
            expect(matchers_1.matchesSelectBest).toHaveBeenCalledWith('test criteria', outputs, { provider: 'test-provider' }, { testVar: 'value' }, mockCallApiContext);
        });
        it('should work when callApiContext is undefined', async () => {
            const mockResult = [
                { pass: true, score: 1, reason: 'best' },
                { pass: false, score: 0, reason: 'not best' },
            ];
            jest.mocked(matchers_1.matchesSelectBest).mockResolvedValue(mockResult);
            const test = { vars: { testVar: 'value' } };
            const assertion = { type: 'select-best', value: 'test criteria' };
            const outputs = ['output1', 'output2'];
            await (0, index_1.runCompareAssertion)(test, assertion, outputs, undefined);
            expect(matchers_1.matchesSelectBest).toHaveBeenCalledWith('test criteria', outputs, { provider: undefined, rubricPrompt: undefined }, { testVar: 'value' }, undefined);
        });
    });
});
//# sourceMappingURL=contextPropagation.test.js.map