"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("../../src/matchers");
const defaults_1 = require("../../src/providers/openai/defaults");
const embedding_1 = require("../../src/providers/openai/embedding");
describe('matchesSimilarity', () => {
    beforeEach(() => {
        jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockImplementation((text) => {
            if (text === 'Expected output' || text === 'Sample output') {
                return Promise.resolve({
                    embedding: [1, 0, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            else if (text === 'Different output') {
                return Promise.resolve({
                    embedding: [0, 1, 0],
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                });
            }
            return Promise.reject(new Error('Unexpected input'));
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should pass when similarity is above the threshold', async () => {
        const expected = 'Expected output';
        const output = 'Sample output';
        const threshold = 0.5;
        await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold)).resolves.toEqual({
            pass: true,
            reason: 'Similarity 1.00 is greater than or equal to threshold 0.5',
            score: 1,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
        });
    });
    it('should fail when similarity is below the threshold', async () => {
        const expected = 'Expected output';
        const output = 'Different output';
        const threshold = 0.9;
        await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold)).resolves.toEqual({
            pass: false,
            reason: 'Similarity 0.00 is less than threshold 0.9',
            score: 0,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
        });
    });
    it('should fail when inverted similarity is above the threshold', async () => {
        const expected = 'Expected output';
        const output = 'Sample output';
        const threshold = 0.5;
        await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, true /* invert */)).resolves.toEqual({
            pass: false,
            reason: 'Similarity 1.00 is greater than or equal to threshold 0.5',
            score: 0,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
        });
    });
    it('should pass when inverted similarity is below the threshold', async () => {
        const expected = 'Expected output';
        const output = 'Different output';
        const threshold = 0.9;
        await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, true /* invert */)).resolves.toEqual({
            pass: true,
            reason: 'Similarity 0.00 is less than threshold 0.9',
            score: 1,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
        });
    });
    it('should use the overridden similarity grading config', async () => {
        const expected = 'Expected output';
        const output = 'Sample output';
        const threshold = 0.5;
        const grading = {
            provider: {
                id: 'openai:embedding:text-embedding-ada-9999999',
                config: {
                    apiKey: 'abc123',
                    temperature: 3.1415926,
                },
            },
        };
        const mockCallApi = jest.spyOn(embedding_1.OpenAiEmbeddingProvider.prototype, 'callEmbeddingApi');
        mockCallApi.mockImplementation(function () {
            expect(this.config.temperature).toBe(3.1415926);
            expect(this.getApiKey()).toBe('abc123');
            return Promise.resolve({
                embedding: [1, 0, 0],
                tokenUsage: { total: 5, prompt: 2, completion: 3 },
            });
        });
        await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, false, grading)).resolves.toEqual({
            pass: true,
            reason: 'Similarity 1.00 is greater than or equal to threshold 0.5',
            score: 1,
            tokensUsed: {
                total: expect.any(Number),
                prompt: expect.any(Number),
                completion: expect.any(Number),
                cached: expect.any(Number),
                completionDetails: expect.any(Object),
                numRequests: 0,
            },
        });
        expect(mockCallApi).toHaveBeenCalledWith('Expected output');
        mockCallApi.mockRestore();
    });
    it('should throw an error when API call fails', async () => {
        const expected = 'Expected output';
        const output = 'Sample output';
        const threshold = 0.5;
        const grading = {
            provider: {
                id: 'openai:embedding:text-embedding-ada-9999999',
                config: {
                    apiKey: 'abc123',
                    temperature: 3.1415926,
                },
            },
        };
        jest
            .spyOn(embedding_1.OpenAiEmbeddingProvider.prototype, 'callEmbeddingApi')
            .mockRejectedValueOnce(new Error('API call failed'));
        await expect(async () => {
            await (0, matchers_1.matchesSimilarity)(expected, output, threshold, false, grading);
        }).rejects.toThrow('API call failed');
    });
    it('should use Nunjucks templating when PROMPTFOO_DISABLE_TEMPLATING is set', async () => {
        process.env.PROMPTFOO_DISABLE_TEMPLATING = 'true';
        const expected = 'Expected {{ var }}';
        const output = 'Output {{ var }}';
        const threshold = 0.8;
        const grading = {
            provider: defaults_1.DefaultEmbeddingProvider,
        };
        jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockResolvedValue({
            embedding: [1, 2, 3],
            tokenUsage: { total: 10, prompt: 5, completion: 5 },
        });
        await (0, matchers_1.matchesSimilarity)(expected, output, threshold, false, grading);
        expect(defaults_1.DefaultEmbeddingProvider.callEmbeddingApi).toHaveBeenCalledWith('Expected {{ var }}');
        expect(defaults_1.DefaultEmbeddingProvider.callEmbeddingApi).toHaveBeenCalledWith('Output {{ var }}');
        process.env.PROMPTFOO_DISABLE_TEMPLATING = undefined;
    });
    describe('dot_product metric', () => {
        it('should pass when dot product is above threshold', async () => {
            const expected = 'Expected output';
            const output = 'Sample output';
            const threshold = 0.5;
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, false, undefined, 'dot_product')).resolves.toMatchObject({
                pass: true,
                score: 1,
            });
        });
        it('should fail when dot product is below threshold', async () => {
            const expected = 'Expected output';
            const output = 'Different output';
            const threshold = 0.9;
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, false, undefined, 'dot_product')).resolves.toMatchObject({
                pass: false,
                score: 0,
            });
        });
        it('should handle inverse correctly for dot product', async () => {
            const expected = 'Expected output';
            const output = 'Sample output';
            const threshold = 0.5;
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, true, undefined, 'dot_product')).resolves.toMatchObject({
                pass: false,
                score: 0,
            });
        });
    });
    describe('euclidean metric', () => {
        beforeEach(() => {
            jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockImplementation((text) => {
                if (text === 'Expected output' || text === 'Sample output') {
                    return Promise.resolve({
                        embedding: [1, 0, 0],
                        tokenUsage: { total: 5, prompt: 2, completion: 3 },
                    });
                }
                else if (text === 'Different output') {
                    return Promise.resolve({
                        embedding: [0, 1, 0],
                        tokenUsage: { total: 5, prompt: 2, completion: 3 },
                    });
                }
                return Promise.reject(new Error('Unexpected input'));
            });
        });
        it('should pass when euclidean distance is below threshold', async () => {
            const expected = 'Expected output';
            const output = 'Sample output';
            const threshold = 0.1; // Very low distance = similar
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, false, undefined, 'euclidean')).resolves.toMatchObject({
                pass: true,
                reason: expect.stringContaining('Distance 0.00 is less than or equal to threshold 0.1'),
            });
        });
        it('should fail when euclidean distance is above threshold', async () => {
            const expected = 'Expected output';
            const output = 'Different output';
            const threshold = 0.5; // Distance is ~1.41, above threshold
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, false, undefined, 'euclidean')).resolves.toMatchObject({
                pass: false,
                reason: expect.stringContaining('Distance 1.41 is greater than threshold 0.5'),
            });
        });
        it('should handle inverse correctly for euclidean', async () => {
            const expected = 'Expected output';
            const output = 'Different output';
            const threshold = 0.5;
            // With inverse, we want distance > threshold, which is true here
            await expect((0, matchers_1.matchesSimilarity)(expected, output, threshold, true, undefined, 'euclidean')).resolves.toMatchObject({
                pass: true,
                reason: expect.stringContaining('Distance 1.41 is greater than threshold 0.5'),
            });
        });
        it('should convert euclidean distance to normalized score', async () => {
            const expected = 'Expected output';
            const output = 'Sample output';
            const threshold = 0.1;
            const result = await (0, matchers_1.matchesSimilarity)(expected, output, threshold, false, undefined, 'euclidean');
            // Distance = 0, so score should be 1 / (1 + 0) = 1
            expect(result.score).toBeCloseTo(1, 2);
        });
    });
    describe('metric validation', () => {
        it('should reject non-cosine metric for callSimilarityApi providers', async () => {
            const mockProvider = {
                id: () => 'test-similarity-provider',
                callSimilarityApi: jest.fn().mockResolvedValue({
                    similarity: 0.9,
                    tokenUsage: { total: 5, prompt: 2, completion: 3 },
                }),
            };
            const grading = {
                provider: mockProvider,
            };
            await expect((0, matchers_1.matchesSimilarity)('expected', 'output', 0.8, false, grading, 'dot_product')).resolves.toMatchObject({
                pass: false,
                reason: expect.stringContaining('only supports cosine similarity'),
            });
        });
    });
});
//# sourceMappingURL=similarity.test.js.map