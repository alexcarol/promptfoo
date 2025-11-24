"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../../src/providers/openai/chat");
const completion_1 = require("../../src/providers/openai/completion");
const embedding_1 = require("../../src/providers/openai/embedding");
const image_1 = require("../../src/providers/nscale/image");
const nscale_1 = require("../../src/providers/nscale");
jest.mock('../../src/providers/openai');
jest.mock('../../src/envars', () => ({
    getEnvString: jest.fn(),
    getEnvBool: jest.fn((_key, defaultValue) => defaultValue),
    getEnvInt: jest.fn((_key, defaultValue) => defaultValue),
    getEnvFloat: jest.fn((_key, defaultValue) => defaultValue),
    getEvalTimeoutMs: jest.fn((defaultValue) => defaultValue),
    getMaxEvalTimeMs: jest.fn((defaultValue) => defaultValue),
    isCI: jest.fn(() => false),
}));
const envars_1 = require("../../src/envars");
describe('createNscaleProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        envars_1.getEnvString.mockReturnValue(undefined);
    });
    it('should create a chat completion provider when type is chat', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.any(Object));
    });
    it('should create a completion provider when type is completion', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:completion:openai/gpt-oss-120b');
        expect(provider).toBeInstanceOf(completion_1.OpenAiCompletionProvider);
        expect(completion_1.OpenAiCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.any(Object));
    });
    it('should create an embedding provider when type is embedding', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:embedding:qwen3-embedding-8b');
        expect(provider).toBeInstanceOf(embedding_1.OpenAiEmbeddingProvider);
        expect(embedding_1.OpenAiEmbeddingProvider).toHaveBeenCalledWith('qwen3-embedding-8b', expect.any(Object));
    });
    it('should create an embedding provider when type is embeddings', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:embeddings:qwen3-embedding-8b');
        expect(provider).toBeInstanceOf(embedding_1.OpenAiEmbeddingProvider);
        expect(embedding_1.OpenAiEmbeddingProvider).toHaveBeenCalledWith('qwen3-embedding-8b', expect.any(Object));
    });
    it('should create an image provider when type is image', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:image:flux/flux.1-schnell');
        expect(provider).toBeInstanceOf(image_1.NscaleImageProvider);
    });
    it('should default to chat completion provider when no type is specified', () => {
        const provider = (0, nscale_1.createNscaleProvider)('nscale:openai/gpt-oss-120b');
        expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.any(Object));
    });
    it('should pass correct configuration to the provider', () => {
        const options = {
            id: 'custom-id',
        };
        (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
        // Verify that the OpenAI provider was called with the correct parameters
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', {
            config: {
                apiBaseUrl: 'https://inference.api.nscale.com/v1',
                apiKey: undefined, // No API key or service token set
                passthrough: {},
            },
            id: 'custom-id',
        });
    });
    it('should prefer service tokens over API keys', () => {
        envars_1.getEnvString.mockReturnValue(undefined);
        const options = {
            env: {
                NSCALE_SERVICE_TOKEN: 'service-token-123',
                NSCALE_API_KEY: 'api-key-456',
            },
        };
        (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
            config: expect.objectContaining({
                apiKey: 'service-token-123',
            }),
        }));
    });
    it('should fall back to API key if no service token is provided', () => {
        envars_1.getEnvString.mockReturnValue(undefined);
        const options = {
            env: {
                NSCALE_API_KEY: 'api-key-456',
            },
        };
        (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
            config: expect.objectContaining({
                apiKey: 'api-key-456',
            }),
        }));
    });
    it('should use explicit config apiKey over environment variables', () => {
        envars_1.getEnvString.mockReturnValue(undefined);
        const options = {
            config: {
                config: {
                    apiKey: 'explicit-key-789',
                },
            },
            env: {
                NSCALE_SERVICE_TOKEN: 'service-token-123',
                NSCALE_API_KEY: 'api-key-456',
            },
        };
        (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
            config: expect.objectContaining({
                apiKey: 'explicit-key-789',
            }),
        }));
    });
    it('should handle model names with slashes', () => {
        (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b');
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.any(Object));
    });
    it('should handle model names with colons', () => {
        (0, nscale_1.createNscaleProvider)('nscale:chat:meta:llama:3.3:70b:instruct');
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('meta:llama:3.3:70b:instruct', expect.any(Object));
    });
    describe('parameter handling', () => {
        it('should add all parameters to passthrough', () => {
            const options = {
                config: {
                    config: {
                        max_tokens: 4096,
                        temperature: 0.7,
                        top_p: 0.9,
                        stream: true,
                        custom_param: 'value',
                    },
                },
            };
            (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: 'https://inference.api.nscale.com/v1',
                    apiKey: undefined, // No API key or service token set
                    passthrough: expect.objectContaining({
                        max_tokens: 4096,
                        temperature: 0.7,
                        top_p: 0.9,
                        stream: true,
                        custom_param: 'value',
                    }),
                }),
            }));
        });
        it('should handle Nscale-specific parameters correctly', () => {
            const options = {
                config: {
                    config: {
                        stop: ['END', 'STOP'],
                        frequency_penalty: 0.1,
                        presence_penalty: 0.2,
                    },
                },
            };
            (0, nscale_1.createNscaleProvider)('nscale:chat:openai/gpt-oss-120b', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: 'https://inference.api.nscale.com/v1',
                    apiKey: undefined, // No API key or service token set
                    passthrough: expect.objectContaining({
                        stop: ['END', 'STOP'],
                        frequency_penalty: 0.1,
                        presence_penalty: 0.2,
                    }),
                }),
            }));
        });
    });
    describe('error handling', () => {
        it('should handle malformed provider string gracefully', () => {
            expect(() => (0, nscale_1.createNscaleProvider)('nscale:')).not.toThrow();
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('', expect.any(Object));
        });
        it('should work without API key or service token (provider will handle auth errors)', () => {
            expect(() => (0, nscale_1.createNscaleProvider)('nscale:openai/gpt-oss-120b')).not.toThrow();
            const provider = (0, nscale_1.createNscaleProvider)('nscale:openai/gpt-oss-120b');
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
        });
    });
    describe('integration behavior', () => {
        it('should create provider with correct base URL and authentication', () => {
            const options = {
                env: {
                    NSCALE_SERVICE_TOKEN: 'test-service-token',
                },
            };
            (0, nscale_1.createNscaleProvider)('nscale:openai/gpt-oss-120b', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-oss-120b', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: 'https://inference.api.nscale.com/v1',
                    apiKey: 'test-service-token',
                }),
            }));
        });
    });
});
//# sourceMappingURL=nscale.test.js.map