"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../src/cache");
const aimlapi_1 = require("../../src/providers/aimlapi");
const chat_1 = require("../../src/providers/openai/chat");
const completion_1 = require("../../src/providers/openai/completion");
const embedding_1 = require("../../src/providers/openai/embedding");
jest.mock('../../src/providers/openai');
jest.mock('../../src/cache');
describe('createAimlApiProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('creates chat completion provider when type is chat', () => {
        const provider = (0, aimlapi_1.createAimlApiProvider)('aimlapi:chat:model-name');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('creates completion provider when type is completion', () => {
        const provider = (0, aimlapi_1.createAimlApiProvider)('aimlapi:completion:model-name');
        expect(provider).toBeInstanceOf(completion_1.OpenAiCompletionProvider);
        expect(completion_1.OpenAiCompletionProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('creates embedding provider when type is embedding', () => {
        const provider = (0, aimlapi_1.createAimlApiProvider)('aimlapi:embedding:model-name');
        expect(provider).toBeInstanceOf(embedding_1.OpenAiEmbeddingProvider);
        expect(embedding_1.OpenAiEmbeddingProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
    it('defaults to chat provider when no type specified', () => {
        const provider = (0, aimlapi_1.createAimlApiProvider)('aimlapi:model-name');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('model-name', expect.any(Object));
    });
});
describe('fetchAimlApiModels', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, aimlapi_1.clearAimlApiModelsCache)();
    });
    it('fetches models from endpoint', async () => {
        jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
            data: { data: [{ id: 'model-a' }, { id: 'model-b' }] },
            cached: false,
            status: 200,
            statusText: 'OK',
        });
        const models = await (0, aimlapi_1.fetchAimlApiModels)();
        expect(cache_1.fetchWithCache).toHaveBeenCalledWith('https://api.aimlapi.com/models', { headers: {} }, expect.any(Number));
        expect(models).toEqual([{ id: 'model-a' }, { id: 'model-b' }]);
    });
    it('uses cache on subsequent calls', async () => {
        jest.mocked(cache_1.fetchWithCache).mockResolvedValue({
            data: { data: [{ id: 'model-x' }] },
            cached: false,
            status: 200,
            statusText: 'OK',
        });
        const first = await (0, aimlapi_1.fetchAimlApiModels)();
        jest.mocked(cache_1.fetchWithCache).mockClear();
        const second = await (0, aimlapi_1.fetchAimlApiModels)();
        expect(first).toEqual(second);
        expect(cache_1.fetchWithCache).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=aimlapi.test.js.map