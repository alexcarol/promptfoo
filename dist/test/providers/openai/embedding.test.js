"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../../src/cache");
const embedding_1 = require("../../../src/providers/openai/embedding");
jest.mock('../../../src/cache');
describe('OpenAI Provider', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        (0, cache_1.disableCache)();
    });
    afterEach(() => {
        (0, cache_1.enableCache)();
    });
    describe('OpenAiEmbeddingProvider', () => {
        const provider = new embedding_1.OpenAiEmbeddingProvider('text-embedding-3-large', {
            config: {
                apiKey: 'test-key',
            },
        });
        it('should call embedding API successfully', async () => {
            const mockResponse = {
                data: [
                    {
                        embedding: [0.1, 0.2, 0.3],
                    },
                ],
                usage: {
                    total_tokens: 10,
                    prompt_tokens: 0,
                    completion_tokens: 0,
                },
            };
            jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
                data: mockResponse,
                cached: false,
                status: 200,
                statusText: 'OK',
            });
            const result = await provider.callEmbeddingApi('test text');
            expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
            expect(result.tokenUsage).toEqual({
                total: 10,
                prompt: 0,
                completion: 0,
            });
        });
        it('should handle API errors', async () => {
            jest.mocked(cache_1.fetchWithCache).mockRejectedValue(new Error('API error'));
            const result = await provider.callEmbeddingApi('test text');
            expect(result.error).toBe('API call error: Error: API error');
            expect(result.embedding).toBeUndefined();
        });
        it('should validate input type', async () => {
            const result = await provider.callEmbeddingApi({ message: 'test' });
            expect(result.error).toBe('Invalid input type for embedding API. Expected string, got object. Input: {"message":"test"}');
            expect(result.embedding).toBeUndefined();
        });
        it('should handle HTTP error status', async () => {
            jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
                data: { error: { message: 'Unauthorized' } },
                cached: false,
                status: 401,
                statusText: 'Unauthorized',
            });
            const result = await provider.callEmbeddingApi('test text');
            expect(result.error).toBe('API error: 401 Unauthorized\n{"error":{"message":"Unauthorized"}}');
            expect(result.embedding).toBeUndefined();
        });
        it('should validate API key', async () => {
            // Clear any environment variables that might provide an API key
            const originalEnv = process.env.OPENAI_API_KEY;
            delete process.env.OPENAI_API_KEY;
            try {
                const providerNoKey = new embedding_1.OpenAiEmbeddingProvider('text-embedding-3-large', {
                    config: {},
                });
                const result = await providerNoKey.callEmbeddingApi('test text');
                expect(result.error).toBe('API key is not set. Set the OPENAI_API_KEY environment variable or add `apiKey` to the provider config.');
                expect(result.embedding).toBeUndefined();
            }
            finally {
                // Always restore original environment state
                if (originalEnv !== undefined) {
                    process.env.OPENAI_API_KEY = originalEnv;
                }
                else {
                    delete process.env.OPENAI_API_KEY;
                }
            }
        });
    });
});
//# sourceMappingURL=embedding.test.js.map