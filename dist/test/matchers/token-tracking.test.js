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
const matchers_1 = require("../../src/matchers");
const index_1 = require("../../src/providers/index");
const defaults_1 = require("../../src/providers/openai/defaults");
describe('Matcher Token Tracking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('matchesLlmRubric', () => {
        it('should track numRequests in token usage', async () => {
            const mockProvider = await (0, index_1.loadApiProvider)('echo');
            const mockCallApi = jest.fn().mockResolvedValue({
                output: JSON.stringify({
                    pass: true,
                    score: 1,
                    reason: 'Test passed',
                }),
                tokenUsage: {
                    total: 100,
                    prompt: 60,
                    completion: 40,
                    cached: 0,
                    numRequests: 1,
                },
            });
            mockProvider.callApi = mockCallApi;
            const result = await (0, matchers_1.matchesLlmRubric)('Test rubric', 'Test output', { provider: mockProvider }, {}, undefined);
            expect(result.tokensUsed).toBeDefined();
            expect(result.tokensUsed?.numRequests).toBe(1);
            expect(result.tokensUsed?.total).toBe(100);
            expect(result.tokensUsed?.prompt).toBe(60);
            expect(result.tokensUsed?.completion).toBe(40);
            expect(result.tokensUsed?.cached).toBe(0);
        });
        it('should default numRequests to 0 when not provided', async () => {
            const mockProvider = await (0, index_1.loadApiProvider)('echo');
            const mockCallApi = jest.fn().mockResolvedValue({
                output: JSON.stringify({
                    pass: true,
                    score: 1,
                    reason: 'Test passed',
                }),
                tokenUsage: {
                    total: 100,
                    prompt: 60,
                    completion: 40,
                    cached: 0,
                    // numRequests not provided
                },
            });
            mockProvider.callApi = mockCallApi;
            const result = await (0, matchers_1.matchesLlmRubric)('Test rubric', 'Test output', { provider: mockProvider }, {}, undefined);
            expect(result.tokensUsed).toBeDefined();
            expect(result.tokensUsed?.numRequests).toBe(0);
        });
    });
    describe('matchesGEval', () => {
        it('should accumulate numRequests across multiple API calls', async () => {
            const mockCallApi = jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi');
            // First call for steps
            mockCallApi.mockResolvedValueOnce({
                output: JSON.stringify({
                    steps: ['Step 1', 'Step 2'],
                }),
                tokenUsage: {
                    total: 50,
                    prompt: 30,
                    completion: 20,
                    cached: 0,
                    numRequests: 1,
                },
            });
            // Second call for evaluation
            mockCallApi.mockResolvedValueOnce({
                output: JSON.stringify({
                    score: 8,
                    reason: 'Good response',
                }),
                tokenUsage: {
                    total: 100,
                    prompt: 60,
                    completion: 40,
                    cached: 10,
                    numRequests: 1,
                },
            });
            const result = await (0, matchers_1.matchesGEval)('Test criteria', 'Test input', 'Test output', 0.7, {});
            expect(result.tokensUsed).toBeDefined();
            expect(result.tokensUsed?.numRequests).toBe(2); // 1 from steps + 1 from evaluation
            expect(result.tokensUsed?.total).toBe(150); // 50 + 100
            expect(result.tokensUsed?.prompt).toBe(90); // 30 + 60
            expect(result.tokensUsed?.completion).toBe(60); // 20 + 40
            expect(result.tokensUsed?.cached).toBe(10); // 0 + 10
        });
    });
    describe('matchesAnswerRelevance', () => {
        it('should track numRequests from embedding calls', async () => {
            const { DefaultGradingProvider, DefaultEmbeddingProvider } = await Promise.resolve().then(() => __importStar(require('../../src/providers/openai/defaults')));
            const mockCallApi = jest.spyOn(DefaultGradingProvider, 'callApi');
            const mockCallEmbeddingApi = jest.spyOn(DefaultEmbeddingProvider, 'callEmbeddingApi');
            // Mock text generation calls (3 times for candidate questions)
            mockCallApi.mockResolvedValue({
                output: 'Generated question',
                tokenUsage: {
                    total: 20,
                    prompt: 10,
                    completion: 10,
                    cached: 0,
                    numRequests: 1,
                },
            });
            // Mock embedding calls
            mockCallEmbeddingApi.mockResolvedValue({
                embedding: [1, 0, 0],
                tokenUsage: {
                    total: 5,
                    prompt: 5,
                    completion: 0,
                    cached: 0,
                    numRequests: 1,
                },
            });
            const result = await (0, matchers_1.matchesAnswerRelevance)('Test input', 'Test output', 0.7, {});
            expect(result.tokensUsed).toBeDefined();
            // 3 text generation + 1 input embedding + 3 question embeddings = 7 requests
            expect(result.tokensUsed?.numRequests).toBe(7);
        });
    });
});
//# sourceMappingURL=token-tracking.test.js.map