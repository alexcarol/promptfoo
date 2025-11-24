"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const llamaApi_1 = require("../../src/providers/llamaApi");
const chat_1 = require("../../src/providers/openai/chat");
jest.mock('../../src/providers/openai/chat', () => {
    return {
        OpenAiChatCompletionProvider: jest
            .fn()
            .mockImplementation((modelName, options) => {
            return {
                modelName,
                config: options?.config || {},
                id: jest.fn().mockReturnValue(`openai:${modelName}`),
                toString: jest.fn().mockReturnValue(`[OpenAI Provider ${modelName}]`),
                toJSON: jest.fn().mockReturnValue({ provider: 'openai', model: modelName }),
            };
        }),
    };
});
describe('LlamaApiProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should initialize with correct default configuration', () => {
            new llamaApi_1.LlamaApiProvider('Llama-4-Maverick-17B-128E-Instruct-FP8');
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Llama-4-Maverick-17B-128E-Instruct-FP8', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: 'https://api.llama.com/compat/v1',
                    apiKeyEnvar: 'LLAMA_API_KEY',
                    passthrough: {},
                }),
            }));
        });
        it('should merge custom options correctly', () => {
            const options = {
                config: {
                    temperature: 0.7,
                    max_tokens: 1000,
                    passthrough: {
                        custom_param: 'value',
                    },
                },
            };
            new llamaApi_1.LlamaApiProvider('Llama-3.3-70B-Instruct', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Llama-3.3-70B-Instruct', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: 'https://api.llama.com/compat/v1',
                    apiKeyEnvar: 'LLAMA_API_KEY',
                    temperature: 0.7,
                    max_tokens: 1000,
                    passthrough: {
                        custom_param: 'value',
                    },
                }),
            }));
        });
    });
    describe('static methods', () => {
        describe('getModelInfo()', () => {
            it('should return model info for valid model ID', () => {
                const modelInfo = llamaApi_1.LlamaApiProvider.getModelInfo('Llama-4-Maverick-17B-128E-Instruct-FP8');
                expect(modelInfo).toBeDefined();
                expect(modelInfo?.id).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
                expect(modelInfo?.inputModalities).toContain('text');
                expect(modelInfo?.inputModalities).toContain('image');
                expect(modelInfo?.contextWindow).toBe(128000);
            });
            it('should return model info for alias', () => {
                const modelInfo = llamaApi_1.LlamaApiProvider.getModelInfo('llama-4-maverick');
                expect(modelInfo).toBeDefined();
                expect(modelInfo?.id).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8');
            });
            it('should return undefined for invalid model', () => {
                const modelInfo = llamaApi_1.LlamaApiProvider.getModelInfo('invalid-model');
                expect(modelInfo).toBeUndefined();
            });
        });
        describe('isMultimodalModel()', () => {
            it('should return true for multimodal models', () => {
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('Llama-4-Maverick-17B-128E-Instruct-FP8')).toBe(true);
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('Llama-4-Scout-17B-16E-Instruct-FP8')).toBe(true);
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('llama-4-maverick')).toBe(true);
            });
            it('should return false for text-only models', () => {
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('Llama-3.3-70B-Instruct')).toBe(false);
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('Llama-3.3-8B-Instruct')).toBe(false);
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('Cerebras-Llama-4-Maverick-17B-128E-Instruct')).toBe(false);
            });
            it('should return false for unknown models', () => {
                expect(llamaApi_1.LlamaApiProvider.isMultimodalModel('unknown-model')).toBe(false);
            });
        });
        describe('validateModelName()', () => {
            it('should validate known model IDs', () => {
                expect(llamaApi_1.LlamaApiProvider.validateModelName('Llama-4-Maverick-17B-128E-Instruct-FP8')).toBe(true);
                expect(llamaApi_1.LlamaApiProvider.validateModelName('Llama-3.3-70B-Instruct')).toBe(true);
                expect(llamaApi_1.LlamaApiProvider.validateModelName('Cerebras-Llama-4-Scout-17B-16E-Instruct')).toBe(true);
            });
            it('should validate model aliases', () => {
                expect(llamaApi_1.LlamaApiProvider.validateModelName('llama-4-maverick')).toBe(true);
                expect(llamaApi_1.LlamaApiProvider.validateModelName('llama-3.3-8b')).toBe(true);
            });
            it('should reject invalid model names', () => {
                expect(llamaApi_1.LlamaApiProvider.validateModelName('invalid-model')).toBe(false);
                expect(llamaApi_1.LlamaApiProvider.validateModelName('')).toBe(false);
            });
        });
    });
    describe('toJSON()', () => {
        it('should redact apiKey and set provider', () => {
            const p = new llamaApi_1.LlamaApiProvider('Llama-3.3-8B-Instruct', {
                config: { temperature: 0.5 },
            });
            // Mock the internal config to include an apiKey for testing
            p.config = { apiKey: 'secret', temperature: 0.5 };
            const originalToJSON = llamaApi_1.LlamaApiProvider.prototype.toJSON;
            const json = originalToJSON.call(p);
            expect(json.provider).toBe('llamaapi');
            expect(json.config).not.toHaveProperty('apiKey');
            expect(json.config.temperature).toBe(0.5);
        });
    });
    describe('id()', () => {
        it('should include llamaapi prefix', () => {
            const p = new llamaApi_1.LlamaApiProvider('Llama-3.3-8B-Instruct');
            // Test the actual implementation
            const originalId = llamaApi_1.LlamaApiProvider.prototype.id;
            const result = originalId.call(p);
            expect(result).toBe('llamaapi:Llama-3.3-8B-Instruct');
        });
    });
});
describe('createLlamaApiProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should create provider for chat format', () => {
        (0, llamaApi_1.createLlamaApiProvider)('llamaapi:chat:Llama-4-Maverick-17B-128E-Instruct-FP8');
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Llama-4-Maverick-17B-128E-Instruct-FP8', expect.any(Object));
    });
    it('should default to chat provider when no type specified', () => {
        (0, llamaApi_1.createLlamaApiProvider)('llamaapi:Llama-3.3-70B-Instruct');
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Llama-3.3-70B-Instruct', expect.any(Object));
    });
    it('should handle model names with colons', () => {
        (0, llamaApi_1.createLlamaApiProvider)('llamaapi:chat:Cerebras-Llama-4-Scout-17B-16E-Instruct');
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Cerebras-Llama-4-Scout-17B-16E-Instruct', expect.any(Object));
    });
    it('should pass options correctly', () => {
        const options = {
            config: {
                config: {
                    temperature: 0.8,
                    max_tokens: 2048,
                },
            },
            id: 'custom-id',
            env: { LLAMA_API_KEY: 'dummy' },
        };
        (0, llamaApi_1.createLlamaApiProvider)('llamaapi:Llama-4-Scout-17B-16E-Instruct-FP8', options);
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('Llama-4-Scout-17B-16E-Instruct-FP8', expect.objectContaining({
            config: expect.objectContaining({
                temperature: 0.8,
                max_tokens: 2048,
                apiBaseUrl: 'https://api.llama.com/compat/v1',
                apiKeyEnvar: 'LLAMA_API_KEY',
            }),
            id: 'custom-id',
            env: expect.objectContaining({ LLAMA_API_KEY: 'dummy' }),
        }));
    });
});
describe('LLAMA_API_MODELS', () => {
    it('should contain expected models', () => {
        const modelIds = llamaApi_1.LLAMA_API_MODELS.map((m) => m.id);
        expect(modelIds).toContain('Llama-4-Maverick-17B-128E-Instruct-FP8');
        expect(modelIds).toContain('Llama-4-Scout-17B-16E-Instruct-FP8');
        expect(modelIds).toContain('Llama-3.3-70B-Instruct');
        expect(modelIds).toContain('Llama-3.3-8B-Instruct');
        expect(modelIds).toContain('Cerebras-Llama-4-Maverick-17B-128E-Instruct');
        expect(modelIds).toContain('Cerebras-Llama-4-Scout-17B-16E-Instruct');
        expect(modelIds).toContain('Groq-Llama-4-Maverick-17B-128E-Instruct');
    });
    it('should have correct modality information', () => {
        const llama4Maverick = llamaApi_1.LLAMA_API_MODELS.find((m) => m.id === 'Llama-4-Maverick-17B-128E-Instruct-FP8');
        expect(llama4Maverick?.inputModalities).toEqual(['text', 'image']);
        expect(llama4Maverick?.outputModalities).toEqual(['text']);
        const llama33 = llamaApi_1.LLAMA_API_MODELS.find((m) => m.id === 'Llama-3.3-70B-Instruct');
        expect(llama33?.inputModalities).toEqual(['text']);
        expect(llama33?.outputModalities).toEqual(['text']);
    });
    it('should have correct context windows', () => {
        const llama4Maverick = llamaApi_1.LLAMA_API_MODELS.find((m) => m.id === 'Llama-4-Maverick-17B-128E-Instruct-FP8');
        expect(llama4Maverick?.contextWindow).toBe(128000);
        const cerebrasModel = llamaApi_1.LLAMA_API_MODELS.find((m) => m.id === 'Cerebras-Llama-4-Maverick-17B-128E-Instruct');
        expect(cerebrasModel?.contextWindow).toBe(32000);
    });
});
describe('LLAMA_API_MULTIMODAL_MODELS', () => {
    it('should contain only multimodal models', () => {
        expect(llamaApi_1.LLAMA_API_MULTIMODAL_MODELS).toEqual([
            'Llama-4-Maverick-17B-128E-Instruct-FP8',
            'Llama-4-Scout-17B-16E-Instruct-FP8',
        ]);
    });
    it('should not contain text-only models', () => {
        expect(llamaApi_1.LLAMA_API_MULTIMODAL_MODELS).not.toContain('Llama-3.3-70B-Instruct');
        expect(llamaApi_1.LLAMA_API_MULTIMODAL_MODELS).not.toContain('Llama-3.3-8B-Instruct');
        expect(llamaApi_1.LLAMA_API_MULTIMODAL_MODELS).not.toContain('Cerebras-Llama-4-Maverick-17B-128E-Instruct');
    });
});
//# sourceMappingURL=llamaApi.test.js.map