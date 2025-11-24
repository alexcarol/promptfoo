"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../../src/cache");
const embedding_1 = require("../../../src/providers/azure/embedding");
jest.mock('../../../src/cache');
describe('AzureEmbeddingProvider', () => {
    let provider;
    beforeEach(() => {
        provider = new embedding_1.AzureEmbeddingProvider('test-deployment', {
            endpoint: 'https://test.openai.azure.com',
            apiKey: 'test-key',
            headers: {
                'Custom-Header': 'custom-value',
            },
        });
        provider.getApiBaseUrl = () => 'https://test.openai.azure.com';
        provider.authHeaders = {
            'api-key': 'test-key',
        };
        jest.spyOn(provider, 'ensureInitialized').mockImplementation(() => Promise.resolve());
        jest.mocked(cache_1.fetchWithCache).mockReset();
    });
    it('should handle cached response', async () => {
        const mockResponse = {
            data: {
                data: [
                    {
                        embedding: [0.1, 0.2, 0.3],
                    },
                ],
                usage: {
                    total_tokens: 10,
                },
            },
            cached: true,
        };
        jest.mocked(cache_1.fetchWithCache).mockResolvedValueOnce(mockResponse);
        const result = await provider.callEmbeddingApi('test text');
        expect(result).toEqual({
            embedding: [0.1, 0.2, 0.3],
            tokenUsage: {
                cached: 10,
                total: 10,
            },
        });
    });
    it('should handle API call errors', async () => {
        jest.mocked(cache_1.fetchWithCache).mockRejectedValueOnce(new Error('API error'));
        const result = await provider.callEmbeddingApi('test text');
        expect(result).toEqual({
            error: 'API call error: Error: API error',
            tokenUsage: {
                total: 0,
                prompt: 0,
                completion: 0,
            },
        });
    });
    it('should handle missing embedding in response', async () => {
        const mockResponse = {
            data: {
                data: [{}],
                usage: {
                    total_tokens: 10,
                    prompt_tokens: 5,
                    completion_tokens: 5,
                },
            },
            cached: false,
        };
        jest.mocked(cache_1.fetchWithCache).mockResolvedValueOnce(mockResponse);
        const result = await provider.callEmbeddingApi('test text');
        expect(result).toEqual({
            error: expect.stringContaining('No embedding returned'),
            tokenUsage: {
                total: 10,
                prompt: 5,
                completion: 5,
            },
        });
    });
    it('should handle missing API host', async () => {
        provider.getApiBaseUrl = () => undefined;
        await expect(provider.callEmbeddingApi('test text')).rejects.toThrow('Azure API host must be set.');
    });
    it('should handle API response error with missing usage fields', async () => {
        const mockResponse = {
            data: {
                data: [{}],
                // usage is missing
            },
            cached: false,
        };
        jest.mocked(cache_1.fetchWithCache).mockResolvedValueOnce(mockResponse);
        const result = await provider.callEmbeddingApi('test text');
        expect(result).toEqual({
            error: expect.stringContaining('No embedding returned'),
            tokenUsage: {
                total: undefined,
                prompt: undefined,
                completion: undefined,
            },
        });
    });
    it('should handle API response error with cached true and missing usage fields', async () => {
        const mockResponse = {
            data: {
                data: [{}],
                // usage is missing
            },
            cached: true,
        };
        jest.mocked(cache_1.fetchWithCache).mockResolvedValueOnce(mockResponse);
        await expect(provider.callEmbeddingApi('test text')).rejects.toThrow(/Cannot read (?:properties|property) of undefined/);
    });
});
//# sourceMappingURL=embedding.test.js.map