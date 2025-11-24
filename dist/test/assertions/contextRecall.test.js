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
const contextRecall_1 = require("../../src/assertions/contextRecall");
const contextUtils = __importStar(require("../../src/assertions/contextUtils"));
const matchers = __importStar(require("../../src/matchers"));
jest.mock('../../src/matchers');
jest.mock('../../src/assertions/contextUtils');
describe('handleContextRecall', () => {
    const mockMatchesContextRecall = jest.spyOn(matchers, 'matchesContextRecall');
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should pass when context recall is above threshold', async () => {
        const mockResult = {
            pass: true,
            score: 0.9,
            reason: 'Context contains expected information',
            metadata: {
                sentenceAttributions: [
                    { sentence: 'Test sentence 1', attributed: true },
                    { sentence: 'Test sentence 2', attributed: false },
                ],
                totalSentences: 2,
                attributedSentences: 1,
                score: 0.9,
            },
        };
        mockMatchesContextRecall.mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall', threshold: 0.8 },
            renderedValue: 'Expected fact',
            prompt: 'test prompt',
            test: { vars: { context: 'test context' }, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { context: 'test context' },
                test: { vars: { context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        const result = await (0, contextRecall_1.handleContextRecall)(params);
        expect(result.pass).toBe(true);
        expect(result.score).toBe(0.9);
        expect(result.reason).toBe('Context contains expected information');
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.context).toBe('test context');
        // Verify metadata from matcher is preserved
        expect(result.metadata?.sentenceAttributions).toEqual([
            { sentence: 'Test sentence 1', attributed: true },
            { sentence: 'Test sentence 2', attributed: false },
        ]);
        expect(result.metadata?.totalSentences).toBe(2);
        expect(result.metadata?.attributedSentences).toBe(1);
        expect(result.metadata?.score).toBe(0.9);
        expect(mockMatchesContextRecall).toHaveBeenCalledWith('test context', 'Expected fact', 0.8, {}, { context: 'test context' }, undefined);
    });
    it('should fail when context recall is below threshold', async () => {
        const mockResult = { pass: false, score: 0.3, reason: 'Context missing expected information' };
        mockMatchesContextRecall.mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall', threshold: 0.7 },
            renderedValue: 'Missing fact',
            prompt: 'test prompt',
            test: { vars: { context: 'incomplete context' }, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { context: 'incomplete context' },
                test: { vars: { context: 'incomplete context' }, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        const result = await (0, contextRecall_1.handleContextRecall)(params);
        expect(result.pass).toBe(false);
        expect(result.score).toBe(0.3);
        expect(result.reason).toBe('Context missing expected information');
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.context).toBe('test context');
        expect(mockMatchesContextRecall).toHaveBeenCalledWith('test context', 'Missing fact', 0.7, {}, { context: 'incomplete context' }, undefined);
    });
    it('should use default threshold of 0 when not provided', async () => {
        const mockResult = { pass: true, score: 1, reason: 'Perfect match' };
        mockMatchesContextRecall.mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test context');
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall' },
            renderedValue: 'test value',
            prompt: 'test prompt',
            test: { vars: { context: 'test context' }, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { context: 'test context' },
                test: { vars: { context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        const result = await (0, contextRecall_1.handleContextRecall)(params);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.context).toBe('test context');
        expect(mockMatchesContextRecall).toHaveBeenCalledWith('test context', 'test value', 0, {}, { context: 'test context' }, undefined);
    });
    it('should fall back to prompt when no context variable', async () => {
        const mockResult = { pass: true, score: 1, reason: 'ok' };
        mockMatchesContextRecall.mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('test prompt');
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall' },
            renderedValue: 'test output',
            prompt: 'test prompt',
            test: { vars: {}, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: {},
                test: { vars: {}, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        const result = await (0, contextRecall_1.handleContextRecall)(params);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.context).toBe('test prompt');
        expect(contextUtils.resolveContext).toHaveBeenCalledWith(params.assertion, params.test, params.output, 'test prompt', 'test prompt', {});
        expect(mockMatchesContextRecall).toHaveBeenCalledWith('test prompt', 'test output', 0, {}, {}, undefined);
    });
    it('should use contextTransform when provided', async () => {
        const mockResult = { pass: true, score: 1, reason: 'ok' };
        mockMatchesContextRecall.mockResolvedValue(mockResult);
        jest.mocked(contextUtils.resolveContext).mockResolvedValue('ctx');
        const mockProvider = { id: () => 'p', callApi: jest.fn() };
        const params = {
            assertion: { type: 'context-recall', contextTransform: 'expr' },
            renderedValue: 'val',
            prompt: 'prompt',
            test: { vars: {}, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'prompt',
                vars: {},
                test: { vars: {}, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: { context: 'hello' },
            outputString: 'str',
            provider: mockProvider,
            providerResponse: {},
        };
        const result = await (0, contextRecall_1.handleContextRecall)(params);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.context).toBe('ctx');
        expect(contextUtils.resolveContext).toHaveBeenCalledWith(params.assertion, params.test, params.output, 'prompt', 'prompt', {});
        expect(mockMatchesContextRecall).toHaveBeenCalledWith('ctx', 'val', 0, {}, {}, undefined);
    });
    it('should throw error when renderedValue is not a string', async () => {
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall' },
            renderedValue: 123,
            prompt: 'test prompt',
            test: { vars: { context: 'test context' }, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: 'test prompt',
                vars: { context: 'test context' },
                test: { vars: { context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        await expect((0, contextRecall_1.handleContextRecall)(params)).rejects.toThrow('context-recall assertion requires a string value (expected answer or fact to verify)');
    });
    it('should throw error when prompt is missing', async () => {
        const mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        const params = {
            assertion: { type: 'context-recall' },
            renderedValue: 'test value',
            prompt: undefined,
            test: { vars: { context: 'test context' }, options: {} },
            baseType: 'context-recall',
            assertionValueContext: {
                prompt: undefined,
                vars: { context: 'test context' },
                test: { vars: { context: 'test context' }, options: {} },
                logProbs: undefined,
                provider: mockProvider,
                providerResponse: undefined,
            },
            inverse: false,
            output: 'test output',
            outputString: 'test output',
            provider: mockProvider,
            providerResponse: {},
        };
        await expect((0, contextRecall_1.handleContextRecall)(params)).rejects.toThrow('context-recall assertion requires a prompt');
    });
});
//# sourceMappingURL=contextRecall.test.js.map