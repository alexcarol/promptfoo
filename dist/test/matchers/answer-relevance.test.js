"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("../../src/matchers");
const index_1 = require("../../src/prompts/index");
const defaults_1 = require("../../src/providers/openai/defaults");
describe('matchesAnswerRelevance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi').mockReset();
        jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockReset();
        jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi').mockResolvedValue({
            output: 'foobar',
            tokenUsage: { total: 10, prompt: 5, completion: 5 },
        });
        jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockResolvedValue({
            embedding: [1, 0, 0],
            tokenUsage: { total: 5, prompt: 2, completion: 3 },
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should pass when the relevance score is above the threshold', async () => {
        const input = 'Input text';
        const output = 'Sample output';
        const threshold = 0.5;
        const mockCallApi = jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi');
        mockCallApi.mockImplementation(() => {
            return Promise.resolve({
                output: 'foobar',
                tokenUsage: { total: 10, prompt: 5, completion: 5 },
            });
        });
        const mockCallEmbeddingApi = jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi');
        mockCallEmbeddingApi.mockImplementation(function () {
            return Promise.resolve({
                embedding: [1, 0, 0],
                tokenUsage: { total: 5, prompt: 2, completion: 3 },
            });
        });
        await expect((0, matchers_1.matchesAnswerRelevance)(input, output, threshold)).resolves.toEqual({
            pass: true,
            reason: 'Relevance 1.00 is greater than threshold 0.5',
            score: 1,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
            metadata: {
                generatedQuestions: expect.arrayContaining([
                    expect.objectContaining({
                        question: expect.any(String),
                        similarity: expect.any(Number),
                    }),
                ]),
                averageSimilarity: 1,
                threshold: 0.5,
            },
        });
        expect(mockCallApi).toHaveBeenCalledWith(expect.stringContaining(index_1.ANSWER_RELEVANCY_GENERATE.slice(0, 50)), expect.any(Object));
        expect(mockCallEmbeddingApi).toHaveBeenCalledWith('Input text');
    });
    it('should fail when the relevance score is below the threshold', async () => {
        const input = 'Input text';
        const output = 'Different output';
        const threshold = 0.5;
        const mockCallApi = jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi');
        mockCallApi.mockImplementation((text) => {
            return Promise.resolve({
                output: text,
                tokenUsage: { total: 10, prompt: 5, completion: 5 },
            });
        });
        const mockCallEmbeddingApi = jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi');
        mockCallEmbeddingApi.mockImplementation((text) => {
            if (text.includes('Input text')) {
                return Promise.resolve({
                    embedding: [1, 0, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            else if (text.includes('Different output')) {
                return Promise.resolve({
                    embedding: [0, 1, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            return Promise.reject(new Error(`Unexpected input ${text}`));
        });
        await expect((0, matchers_1.matchesAnswerRelevance)(input, output, threshold)).resolves.toEqual({
            pass: false,
            reason: 'Relevance 0.00 is less than threshold 0.5',
            score: 0,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
            metadata: {
                generatedQuestions: expect.arrayContaining([
                    expect.objectContaining({
                        question: expect.any(String),
                        similarity: expect.any(Number),
                    }),
                ]),
                averageSimilarity: 0,
                threshold: 0.5,
            },
        });
        expect(mockCallApi).toHaveBeenCalledWith(expect.stringContaining(index_1.ANSWER_RELEVANCY_GENERATE.slice(0, 50)), expect.any(Object));
        expect(mockCallEmbeddingApi).toHaveBeenCalledWith(expect.stringContaining(index_1.ANSWER_RELEVANCY_GENERATE.slice(0, 50)));
    });
    it('tracks token usage for successful calls', async () => {
        const input = 'Input text';
        const output = 'Sample output';
        const threshold = 0.5;
        const result = await (0, matchers_1.matchesAnswerRelevance)(input, output, threshold);
        expect(result.tokensUsed?.total).toBeGreaterThan(0);
        expect(result.tokensUsed?.prompt).toBeGreaterThan(0);
        expect(result.tokensUsed?.completion).toBeGreaterThan(0);
        expect(result.tokensUsed?.total).toBe((result.tokensUsed?.prompt || 0) + (result.tokensUsed?.completion || 0));
        expect(result.tokensUsed?.total).toBe(50);
        expect(result.tokensUsed?.cached).toBe(0);
        expect(result.tokensUsed?.completionDetails).toBeDefined();
    });
    it('should return metadata with generated questions and similarities', async () => {
        const input = 'What is the capital of France?';
        const output = 'The capital of France is Paris.';
        const threshold = 0.7;
        // Mock 3 different generated questions
        let callCount = 0;
        jest.spyOn(defaults_1.DefaultGradingProvider, 'callApi').mockImplementation(() => {
            const questions = [
                'What is the capital city of France?',
                'Which city is the capital of France?',
                "What is France's capital?",
            ];
            return Promise.resolve({
                output: questions[callCount++ % 3],
                tokenUsage: { total: 10, prompt: 5, completion: 5 },
            });
        });
        // Mock embeddings with varying similarities
        jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockImplementation((text) => {
            if (text === input) {
                return Promise.resolve({
                    embedding: [1, 0, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            else if (text.includes('capital') && text.includes('France')) {
                // Similar questions get high similarity
                return Promise.resolve({
                    embedding: [0.9, 0.1, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            return Promise.resolve({
                embedding: [0.8, 0.2, 0],
                tokenUsage: { total: 5, prompt: 2, completion: 3 },
            });
        });
        const result = await (0, matchers_1.matchesAnswerRelevance)(input, output, threshold);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.generatedQuestions).toHaveLength(3);
        expect(result.metadata?.generatedQuestions[0]).toMatchObject({
            question: expect.stringContaining('capital'),
            similarity: expect.any(Number),
        });
        expect(result.metadata?.averageSimilarity).toBeCloseTo(0.99, 2);
        expect(result.metadata?.threshold).toBe(0.7);
        expect(result.pass).toBe(true);
    });
});
//# sourceMappingURL=answer-relevance.test.js.map