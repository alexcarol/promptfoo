"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cliState_1 = __importDefault(require("../../../src/cliState"));
const index_1 = require("../../../src/providers/index");
const chat_1 = require("../../../src/providers/openai/chat");
const constants_1 = require("../../../src/redteam/providers/constants");
const shared_1 = require("../../../src/redteam/providers/shared");
const time_1 = require("../../../src/util/time");
jest.mock('../../../src/util/time');
jest.mock('../../../src/cliState', () => ({
    __esModule: true,
    default: {
        config: {
            redteam: {
                provider: undefined,
            },
        },
    },
}));
jest.mock('../../../src/providers/openai');
jest.mock('../../../src/providers', () => ({
    loadApiProviders: jest.fn(),
}));
const mockedSleep = jest.mocked(time_1.sleep);
const mockedLoadApiProviders = jest.mocked(index_1.loadApiProviders);
const mockedOpenAiProvider = jest.mocked(chat_1.OpenAiChatCompletionProvider);
describe('shared redteam provider utilities', () => {
    beforeEach(() => {
        // Clear all mocks thoroughly
        jest.clearAllMocks();
        jest.resetAllMocks();
        // Reset specific mocks
        mockedSleep.mockClear();
        mockedLoadApiProviders.mockClear();
        mockedOpenAiProvider.mockClear();
        // Clear the redteam provider manager cache
        shared_1.redteamProviderManager.clearProvider();
        // Reset cliState to default
        cliState_1.default.config = {
            redteam: {
                provider: undefined,
            },
        };
        // Reset OpenAI provider mock to default behavior
        mockedOpenAiProvider.mockImplementation((model, options) => {
            const mockInstance = {
                id: () => `openai:${model}`,
                callApi: jest.fn(),
                toString: () => `OpenAI(${model})`,
                config: options?.config || {},
                getApiKey: jest.fn(),
                getApiUrl: jest.fn(),
                getApiUrlDefault: jest.fn(),
                getOrganization: jest.fn(),
                requiresApiKey: jest.fn(),
                initializationPromise: null,
                loadedFunctionCallbacks: {},
                mcpClient: null,
            };
            return mockInstance;
        });
    });
    describe('RedteamProviderManager', () => {
        const mockApiProvider = {
            id: () => 'test-provider',
            callApi: jest.fn(),
        };
        it('creates default OpenAI provider when no provider specified', async () => {
            const mockOpenAiInstance = {
                id: () => `openai:${constants_1.ATTACKER_MODEL}`,
                callApi: jest.fn(),
                toString: () => `OpenAI(${constants_1.ATTACKER_MODEL})`,
                config: { temperature: constants_1.TEMPERATURE, response_format: undefined },
                getApiKey: jest.fn(),
                getApiUrl: jest.fn(),
                getApiUrlDefault: jest.fn(),
                getOrganization: jest.fn(),
                requiresApiKey: jest.fn(),
                initializationPromise: null,
                loadedFunctionCallbacks: {},
                mcpClient: null,
            };
            // Clear and set up specific mock for this test
            mockedOpenAiProvider.mockClear();
            mockedOpenAiProvider.mockReturnValue(mockOpenAiInstance);
            const result = await shared_1.redteamProviderManager.getProvider({});
            expect(result).toBe(mockOpenAiInstance);
            expect(mockedOpenAiProvider).toHaveBeenCalledWith(constants_1.ATTACKER_MODEL, {
                config: {
                    temperature: constants_1.TEMPERATURE,
                    response_format: undefined,
                },
            });
        });
        it('clears cached providers', async () => {
            const mockOpenAiInstance = {
                id: () => `openai:${constants_1.ATTACKER_MODEL}`,
                callApi: jest.fn(),
                toString: () => `OpenAI(${constants_1.ATTACKER_MODEL})`,
                config: { temperature: constants_1.TEMPERATURE, response_format: undefined },
                getApiKey: jest.fn(),
                getApiUrl: jest.fn(),
                getApiUrlDefault: jest.fn(),
                getOrganization: jest.fn(),
                requiresApiKey: jest.fn(),
                initializationPromise: null,
                loadedFunctionCallbacks: {},
                mcpClient: null,
            };
            // Clear and set up specific mock for this test
            mockedOpenAiProvider.mockClear();
            mockedOpenAiProvider.mockReturnValue(mockOpenAiInstance);
            // First call to set up the cache
            await shared_1.redteamProviderManager.getProvider({});
            // Clear the cache
            shared_1.redteamProviderManager.clearProvider();
            mockedOpenAiProvider.mockClear();
            // Second call should create a new provider
            await shared_1.redteamProviderManager.getProvider({});
            expect(mockedOpenAiProvider).toHaveBeenCalledTimes(1);
        });
        it('loads provider from string identifier', async () => {
            mockedLoadApiProviders.mockResolvedValue([mockApiProvider]);
            const result = await shared_1.redteamProviderManager.getProvider({ provider: 'test-provider' });
            expect(result).toBe(mockApiProvider);
            expect(mockedLoadApiProviders).toHaveBeenCalledWith(['test-provider']);
        });
        it('loads provider from provider options', async () => {
            const providerOptions = { id: 'test-provider', apiKey: 'test-key' };
            mockedLoadApiProviders.mockResolvedValue([mockApiProvider]);
            const result = await shared_1.redteamProviderManager.getProvider({ provider: providerOptions });
            expect(result).toBe(mockApiProvider);
            expect(mockedLoadApiProviders).toHaveBeenCalledWith([providerOptions]);
        });
        it('uses small model when preferSmallModel is true', async () => {
            const mockOpenAiInstance = {
                id: () => `openai:${constants_1.ATTACKER_MODEL_SMALL}`,
                callApi: jest.fn(),
                toString: () => `OpenAI(${constants_1.ATTACKER_MODEL_SMALL})`,
                config: { temperature: constants_1.TEMPERATURE, response_format: undefined },
                getApiKey: jest.fn(),
                getApiUrl: jest.fn(),
                getApiUrlDefault: jest.fn(),
                getOrganization: jest.fn(),
                requiresApiKey: jest.fn(),
                initializationPromise: null,
                loadedFunctionCallbacks: {},
                mcpClient: null,
            };
            // Clear and set up specific mock for this test
            mockedOpenAiProvider.mockClear();
            mockedOpenAiProvider.mockReturnValue(mockOpenAiInstance);
            const result = await shared_1.redteamProviderManager.getProvider({ preferSmallModel: true });
            expect(result).toBe(mockOpenAiInstance);
            expect(mockedOpenAiProvider).toHaveBeenCalledWith(constants_1.ATTACKER_MODEL_SMALL, {
                config: {
                    temperature: constants_1.TEMPERATURE,
                    response_format: undefined,
                },
            });
        });
        it('sets response_format to json_object when jsonOnly is true', async () => {
            const mockOpenAiInstance = {
                id: () => `openai:${constants_1.ATTACKER_MODEL}`,
                callApi: jest.fn(),
                toString: () => `OpenAI(${constants_1.ATTACKER_MODEL})`,
                config: { temperature: constants_1.TEMPERATURE, response_format: { type: 'json_object' } },
                getApiKey: jest.fn(),
                getApiUrl: jest.fn(),
                getApiUrlDefault: jest.fn(),
                getOrganization: jest.fn(),
                requiresApiKey: jest.fn(),
                initializationPromise: null,
                loadedFunctionCallbacks: {},
                mcpClient: null,
            };
            // Clear and set up specific mock for this test
            mockedOpenAiProvider.mockClear();
            mockedOpenAiProvider.mockReturnValue(mockOpenAiInstance);
            const result = await shared_1.redteamProviderManager.getProvider({ jsonOnly: true });
            expect(result).toBe(mockOpenAiInstance);
            expect(mockedOpenAiProvider).toHaveBeenCalledWith(constants_1.ATTACKER_MODEL, {
                config: {
                    temperature: constants_1.TEMPERATURE,
                    response_format: { type: 'json_object' },
                },
            });
        });
        it('uses provider from cliState if available', async () => {
            const mockStateProvider = {
                id: () => 'state-provider',
                callApi: jest.fn(),
            };
            // Clear and set up cliState for this test
            cliState_1.default.config = {
                redteam: {
                    provider: mockStateProvider,
                },
            };
            const result = await shared_1.redteamProviderManager.getProvider({});
            expect(result).toBe(mockStateProvider);
            // Clean up for next test
            cliState_1.default.config.redteam.provider = undefined;
        });
        it('sets and reuses providers', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest.fn(),
            };
            mockedLoadApiProviders.mockResolvedValue([mockProvider]);
            // Set the provider
            await shared_1.redteamProviderManager.setProvider('test-provider');
            // Get the provider - should use cached version
            const result = await shared_1.redteamProviderManager.getProvider({});
            const jsonResult = await shared_1.redteamProviderManager.getProvider({ jsonOnly: true });
            expect(result).toBe(mockProvider);
            expect(jsonResult).toBe(mockProvider);
            expect(mockedLoadApiProviders).toHaveBeenCalledTimes(2); // Once for regular, once for jsonOnly
        });
        describe('getGradingProvider', () => {
            it('returns cached grading provider set via setGradingProvider', async () => {
                shared_1.redteamProviderManager.clearProvider();
                const gradingInstance = {
                    id: () => 'grading-cached',
                    callApi: jest.fn(),
                };
                // Set concrete instance and retrieve it (jsonOnly false)
                await shared_1.redteamProviderManager.setGradingProvider(gradingInstance);
                const got = await shared_1.redteamProviderManager.getGradingProvider();
                expect(got.id()).toBe('grading-cached');
            });
            it('uses defaultTest chain when no cached grading provider', async () => {
                shared_1.redteamProviderManager.clearProvider();
                const mockProvider = {
                    id: () => 'from-defaultTest-provider',
                    callApi: jest.fn(),
                };
                mockedLoadApiProviders.mockResolvedValue([mockProvider]);
                // Inject defaultTest provider config
                cliState_1.default.config = {
                    defaultTest: {
                        provider: 'from-defaultTest-provider',
                    },
                };
                const got = await shared_1.redteamProviderManager.getGradingProvider();
                expect(got).toBe(mockProvider);
                expect(mockedLoadApiProviders).toHaveBeenCalledWith(['from-defaultTest-provider']);
            });
            it('falls back to redteam provider when grading not set', async () => {
                shared_1.redteamProviderManager.clearProvider();
                cliState_1.default.config = {}; // no defaultTest
                // Expect fallback to default OpenAI redteam provider
                const got = await shared_1.redteamProviderManager.getGradingProvider({ jsonOnly: true });
                expect(got.id()).toContain('openai:');
            });
        });
        it('handles thrown errors in getTargetResponse', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockRejectedValue(new Error('Network error')),
            };
            const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(result).toEqual({
                output: '',
                error: 'Network error',
                tokenUsage: { numRequests: 1 },
            });
        });
        describe('Multilingual provider', () => {
            it('getMultilingualProvider returns undefined when not set', async () => {
                // Ensure clean state
                shared_1.redteamProviderManager.clearProvider();
                const result = await shared_1.redteamProviderManager.getMultilingualProvider();
                expect(result).toBeUndefined();
            });
            it('setMultilingualProvider caches provider and getMultilingualProvider returns it', async () => {
                const mockProvider = {
                    id: () => 'test-multilingual-provider',
                    callApi: jest.fn(),
                };
                mockedLoadApiProviders.mockResolvedValueOnce([mockProvider]);
                await shared_1.redteamProviderManager.setMultilingualProvider('test-multilingual-provider');
                const result = await shared_1.redteamProviderManager.getMultilingualProvider();
                expect(result).toBe(mockProvider);
                expect(mockedLoadApiProviders).toHaveBeenCalledWith(['test-multilingual-provider']);
            });
            it('setMultilingualProvider uses jsonOnly response_format when defaulting to OpenAI', async () => {
                const mockOpenAiInstance = {
                    id: () => `openai:${constants_1.ATTACKER_MODEL}`,
                    callApi: jest.fn(),
                    toString: () => `OpenAI(${constants_1.ATTACKER_MODEL})`,
                    config: { temperature: constants_1.TEMPERATURE, response_format: { type: 'json_object' } },
                    getApiKey: jest.fn(),
                    getApiUrl: jest.fn(),
                    getApiUrlDefault: jest.fn(),
                    getOrganization: jest.fn(),
                    requiresApiKey: jest.fn(),
                    initializationPromise: null,
                    loadedFunctionCallbacks: {},
                    mcpClient: null,
                };
                mockedOpenAiProvider.mockClear();
                mockedOpenAiProvider.mockReturnValue(mockOpenAiInstance);
                // Pass undefined to trigger default provider creation
                await shared_1.redteamProviderManager.setMultilingualProvider(undefined);
                expect(mockedOpenAiProvider).toHaveBeenCalledWith(constants_1.ATTACKER_MODEL, {
                    config: {
                        temperature: constants_1.TEMPERATURE,
                        response_format: { type: 'json_object' },
                    },
                });
            });
        });
    });
    describe('getTargetResponse', () => {
        it('returns successful response with string output', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    output: 'test response',
                    tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                    sessionId: 'test-session',
                }),
            };
            const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(result).toEqual({
                output: 'test response',
                tokenUsage: { total: 10, prompt: 5, completion: 5, numRequests: 1 },
                sessionId: 'test-session',
            });
        });
        it('passes through context and options', async () => {
            const mockCallApi = jest
                .fn()
                .mockResolvedValue({
                output: 'test response',
                tokenUsage: { numRequests: 1 },
            });
            const mockProvider = {
                id: () => 'test-provider',
                callApi: mockCallApi,
            };
            const prompt = {
                raw: 'test prompt',
                label: 'test',
            };
            const context = {
                prompt,
                vars: { test: 'value' },
            };
            const options = {};
            await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt', context, options);
            expect(mockCallApi).toHaveBeenCalledWith('test prompt', context, options);
        });
        it('stringifies non-string output', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    output: { key: 'value' },
                    tokenUsage: { numRequests: 1 },
                }),
            };
            const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(result).toEqual({
                output: '{"key":"value"}',
                tokenUsage: { numRequests: 1 },
            });
        });
        it('handles provider error response', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    error: 'API error',
                    sessionId: 'error-session',
                }),
            };
            const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(result).toEqual({
                output: '',
                error: 'API error',
                sessionId: 'error-session',
                tokenUsage: { numRequests: 1 },
            });
        });
        it('respects provider delay for non-cached responses', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                delay: 100,
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    output: 'test response',
                    tokenUsage: { numRequests: 1 },
                }),
            };
            await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(mockedSleep).toHaveBeenCalledWith(100);
        });
        it('skips delay for cached responses', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                delay: 100,
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    output: 'test response',
                    cached: true,
                    tokenUsage: { numRequests: 1 },
                }),
            };
            await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(mockedSleep).not.toHaveBeenCalled();
        });
        it('throws error when neither output nor error is set', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockResolvedValue({}),
            };
            await expect((0, shared_1.getTargetResponse)(mockProvider, 'test prompt')).rejects.toThrow(/Target returned malformed response: expected either `output` or `error` property to be set/);
        });
        it('uses default tokenUsage when not provided', async () => {
            const mockProvider = {
                id: () => 'test-provider',
                callApi: jest
                    .fn()
                    .mockResolvedValue({
                    output: 'test response',
                }),
            };
            const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
            expect(result).toEqual({
                output: 'test response',
                tokenUsage: { numRequests: 1 },
            });
        });
        describe('edge cases for empty and falsy responses', () => {
            it('handles empty string output correctly', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        output: '', // Empty string
                        tokenUsage: { numRequests: 1 },
                    }),
                };
                const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
                expect(result).toEqual({
                    output: '',
                    tokenUsage: { numRequests: 1 },
                });
            });
            it('handles zero output correctly', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        output: 0, // Zero value
                        tokenUsage: { numRequests: 1 },
                    }),
                };
                const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
                expect(result).toEqual({
                    output: '0', // Should be stringified
                    tokenUsage: { numRequests: 1 },
                });
            });
            it('handles false output correctly', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        output: false, // Boolean false
                        tokenUsage: { numRequests: 1 },
                    }),
                };
                const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
                expect(result).toEqual({
                    output: 'false', // Should be stringified
                    tokenUsage: { numRequests: 1 },
                });
            });
            it('handles null output correctly', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        output: null, // Null value
                        tokenUsage: { numRequests: 1 },
                    }),
                };
                const result = await (0, shared_1.getTargetResponse)(mockProvider, 'test prompt');
                expect(result).toEqual({
                    output: 'null', // Should be stringified
                    tokenUsage: { numRequests: 1 },
                });
            });
            it('still fails when output property is missing', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        // No output property at all
                        tokenUsage: { numRequests: 1 },
                    }),
                };
                await expect((0, shared_1.getTargetResponse)(mockProvider, 'test prompt')).rejects.toThrow(/Target returned malformed response: expected either `output` or `error` property to be set/);
            });
            it('still fails when both output and error are missing', async () => {
                const mockProvider = {
                    id: () => 'test-provider',
                    callApi: jest
                        .fn()
                        .mockResolvedValue({
                        someOtherField: 'value',
                    }),
                };
                await expect((0, shared_1.getTargetResponse)(mockProvider, 'test prompt')).rejects.toThrow(/Target returned malformed response/);
            });
        });
    });
    describe('messagesToRedteamHistory', () => {
        it('converts valid messages to redteamHistory format', () => {
            const messages = [
                { role: 'system', content: 'system message' },
                { role: 'user', content: 'user message 1' },
                { role: 'assistant', content: 'assistant response 1' },
                { role: 'user', content: 'user message 2' },
                { role: 'assistant', content: 'assistant response 2' },
            ];
            const result = (0, shared_1.messagesToRedteamHistory)(messages);
            expect(result).toEqual([
                { prompt: 'user message 1', output: 'assistant response 1' },
                { prompt: 'user message 2', output: 'assistant response 2' },
            ]);
        });
        it('handles empty messages array', () => {
            const messages = [];
            const result = (0, shared_1.messagesToRedteamHistory)(messages);
            expect(result).toEqual([]);
        });
        it('handles messages with missing content', () => {
            const messages = [
                { role: 'user', content: '' },
                { role: 'assistant', content: undefined },
                { role: 'user', content: 'valid message' },
                { role: 'assistant', content: 'valid response' },
            ];
            const result = (0, shared_1.messagesToRedteamHistory)(messages);
            expect(result).toEqual([
                { prompt: '', output: '' },
                { prompt: 'valid message', output: 'valid response' },
            ]);
        });
        it('handles malformed messages gracefully', () => {
            const messages = [
                { wrong: 'format' },
                null,
                undefined,
                { role: 'user', content: 'valid message' },
                { role: 'assistant', content: 'valid response' },
            ];
            const result = (0, shared_1.messagesToRedteamHistory)(messages);
            expect(result).toEqual([{ prompt: 'valid message', output: 'valid response' }]);
        });
        it('handles non-array input gracefully', () => {
            const result = (0, shared_1.messagesToRedteamHistory)(null);
            expect(result).toEqual([]);
        });
        it('skips incomplete message pairs', () => {
            const messages = [
                { role: 'user', content: 'user message 1' },
                { role: 'user', content: 'user message 2' },
                { role: 'assistant', content: 'assistant response 2' },
            ];
            const result = (0, shared_1.messagesToRedteamHistory)(messages);
            expect(result).toEqual([{ prompt: 'user message 2', output: 'assistant response 2' }]);
        });
    });
    // New tests for tryUnblocking env flag
    describe('tryUnblocking environment flag', () => {
        const originalEnv = process.env.PROMPTFOO_ENABLE_UNBLOCKING;
        afterEach(() => {
            if (originalEnv === undefined) {
                delete process.env.PROMPTFOO_ENABLE_UNBLOCKING;
            }
            else {
                process.env.PROMPTFOO_ENABLE_UNBLOCKING = originalEnv;
            }
        });
        it('short-circuits by default when PROMPTFOO_ENABLE_UNBLOCKING is not set', async () => {
            delete process.env.PROMPTFOO_ENABLE_UNBLOCKING;
            const result = await (0, shared_1.tryUnblocking)({
                messages: [],
                lastResponse: 'irrelevant',
                goal: 'test-goal',
                purpose: 'test-purpose',
            });
            expect(result.success).toBe(false);
            expect(result.unblockingPrompt).toBeUndefined();
        });
        it('does not short-circuit when PROMPTFOO_ENABLE_UNBLOCKING=true', async () => {
            process.env.PROMPTFOO_ENABLE_UNBLOCKING = 'true';
            // Spy on logger to verify we don't see the "disabled by default" message
            const loggerSpy = jest.spyOn(require('../../../src/logger').default, 'debug');
            const result = await (0, shared_1.tryUnblocking)({
                messages: [],
                lastResponse: 'What industry are you in?',
                goal: 'test-goal',
                purpose: 'test-purpose',
            });
            // Verify we did NOT log the "disabled by default" message
            expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining('Disabled by default'));
            // The function should still return false (because server feature check will fail in test env)
            // but for a different reason than the env var check
            expect(result.success).toBe(false);
            loggerSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=shared.test.js.map