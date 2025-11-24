"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../src/cache");
const cometapi_1 = require("../../src/providers/cometapi");
const chat_1 = require("../../src/providers/openai/chat");
const completion_1 = require("../../src/providers/openai/completion");
const embedding_1 = require("../../src/providers/openai/embedding");
jest.mock('../../src/providers/openai/chat', () => ({
    OpenAiChatCompletionProvider: jest.fn(),
}));
jest.mock('../../src/providers/openai/completion', () => ({
    OpenAiCompletionProvider: jest.fn(),
}));
jest.mock('../../src/providers/openai/embedding', () => ({
    OpenAiEmbeddingProvider: jest.fn(),
}));
jest.mock('../../src/cache');
describe('createCometApiProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('creates chat completion provider when type is chat', () => {
        const provider = (0, cometapi_1.createCometApiProvider)('cometapi:chat:model-name');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('creates completion provider when type is completion', () => {
        const provider = (0, cometapi_1.createCometApiProvider)('cometapi:completion:model-name');
        expect(provider).toBeInstanceOf(completion_1.OpenAiCompletionProvider);
        expect(completion_1.OpenAiCompletionProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('creates embedding provider when type is embedding', () => {
        const provider = (0, cometapi_1.createCometApiProvider)('cometapi:embedding:model-name');
        expect(provider).toBeInstanceOf(embedding_1.OpenAiEmbeddingProvider);
        expect(embedding_1.OpenAiEmbeddingProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('creates image provider when type is image', () => {
        const provider = (0, cometapi_1.createCometApiProvider)('cometapi:image:dall-e-3');
        expect(provider).toBeInstanceOf(cometapi_1.CometApiImageProvider);
    });
    it('works with any user-specified model name', () => {
        const provider1 = (0, cometapi_1.createCometApiProvider)('cometapi:chat:my-custom-model');
        expect(provider1).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-custom-model', expect.any(Object));
        const provider2 = (0, cometapi_1.createCometApiProvider)('cometapi:image:any-image-model');
        expect(provider2).toBeInstanceOf(cometapi_1.CometApiImageProvider);
        const provider3 = (0, cometapi_1.createCometApiProvider)('cometapi:embedding:custom-embeddings');
        expect(provider3).toBeInstanceOf(embedding_1.OpenAiEmbeddingProvider);
        expect(embedding_1.OpenAiEmbeddingProvider).toHaveBeenCalledWith('custom-embeddings', expect.any(Object));
    });
    it('defaults to chat provider when no type specified', () => {
        const provider = (0, cometapi_1.createCometApiProvider)('cometapi:any-model-name');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('any-model-name', expect.any(Object));
    });
});
describe('fetchCometApiModels', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, cometapi_1.clearCometApiModelsCache)();
    });
    it('fetches all models from endpoint without filtering', async () => {
        jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
            data: {
                data: [
                    { id: 'gpt-4o' },
                    { id: 'claude-3-5-sonnet' },
                    { id: 'dall-e-3' },
                    { id: 'text-embedding-3-small' },
                    { id: 'whisper-1' }, // Audio model - now included
                    { id: 'custom-user-model' }, // User's custom model
                ],
            },
            cached: false,
            status: 200,
            statusText: 'OK',
        });
        const models = await (0, cometapi_1.fetchCometApiModels)({ COMETAPI_KEY: 'sk-test' });
        expect(cache_1.fetchWithCache).toHaveBeenCalledWith('https://api.cometapi.com/v1/models', { headers: { Accept: 'application/json', Authorization: 'Bearer sk-test' } }, expect.any(Number));
        // All models should be included - no filtering based on model names
        expect(models).toEqual([
            { id: 'gpt-4o' },
            { id: 'claude-3-5-sonnet' },
            { id: 'dall-e-3' },
            { id: 'text-embedding-3-small' },
            { id: 'whisper-1' },
            { id: 'custom-user-model' },
        ]);
    });
    it('uses cache on subsequent calls', async () => {
        jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
            data: { data: [{ id: 'gpt-5-mini' }] },
            cached: false,
            status: 200,
            statusText: 'OK',
        });
        const first = await (0, cometapi_1.fetchCometApiModels)();
        jest.mocked(cache_1.fetchWithCache).mockClear();
        const second = await (0, cometapi_1.fetchCometApiModels)();
        expect(first).toEqual(second);
        expect(cache_1.fetchWithCache).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=cometapi.test.js.map