"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cliState_1 = __importDefault(require("../../src/cliState"));
const matchers_1 = require("../../src/matchers");
const index_1 = require("../../src/providers/index");
jest.mock('../../src/providers', () => ({
    loadApiProvider: jest.fn(),
}));
jest.mock('../../src/cliState');
describe('getGradingProvider', () => {
    const mockProvider = {
        id: () => 'test-provider',
        callApi: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        cliState_1.default.config = {};
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('explicit provider parameter', () => {
        it('should use provider when specified as string', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', 'openai:gpt-4', null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4');
            expect(result).toBe(mockProvider);
        });
        it('should use provider when specified as ApiProvider object', async () => {
            const result = await (0, matchers_1.getGradingProvider)('text', mockProvider, null);
            expect(result).toBe(mockProvider);
            expect(index_1.loadApiProvider).not.toHaveBeenCalled();
        });
        it('should use provider when specified as ProviderOptions', async () => {
            const providerOptions = {
                id: 'openai:gpt-4',
                config: {
                    temperature: 0.5,
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', providerOptions, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4', {
                options: providerOptions,
            });
            expect(result).toBe(mockProvider);
        });
    });
    describe('ProviderTypeMap (embedding/classification/text record)', () => {
        it('should handle embedding provider from ProviderTypeMap', async () => {
            const providerMap = {
                embedding: 'openai:embedding',
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const result = await (0, matchers_1.getGradingProvider)('embedding', providerMap, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:embedding');
            expect(result).toBe(mockProvider);
        });
        it('should handle classification provider from ProviderTypeMap', async () => {
            const providerMap = {
                classification: 'openai:gpt-4',
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const result = await (0, matchers_1.getGradingProvider)('classification', providerMap, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4');
            expect(result).toBe(mockProvider);
        });
        it('should handle text provider from ProviderTypeMap', async () => {
            const providerMap = {
                text: 'anthropic:claude-3-sonnet',
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', providerMap, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('anthropic:claude-3-sonnet');
            expect(result).toBe(mockProvider);
        });
    });
    describe('defaultTest.options.provider fallback', () => {
        it('should use defaultTest.options.provider when no provider specified', async () => {
            const azureProvider = {
                id: () => 'azureopenai:chat:gpt-4',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: 'azureopenai:chat:gpt-4',
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(azureProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('azureopenai:chat:gpt-4');
            expect(result).toBe(azureProvider);
        });
        it('should use defaultTest.provider when options.provider not specified', async () => {
            const azureProvider = {
                id: () => 'azureopenai:chat:gpt-4',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    provider: 'azureopenai:chat:gpt-4',
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(azureProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('azureopenai:chat:gpt-4');
            expect(result).toBe(azureProvider);
        });
        it('should use defaultTest.options.provider.text when specified', async () => {
            const azureProvider = {
                id: () => 'azureopenai:chat:gpt-4',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: {
                            text: 'azureopenai:chat:gpt-4',
                        },
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(azureProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('azureopenai:chat:gpt-4');
            expect(result).toBe(azureProvider);
        });
        it('should prefer defaultTest.provider over defaultTest.options.provider', async () => {
            const azureProvider = {
                id: () => 'azureopenai:chat:gpt-4',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    provider: 'azureopenai:chat:gpt-4',
                    options: {
                        provider: 'openai:gpt-4',
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(azureProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('azureopenai:chat:gpt-4');
            expect(result).toBe(azureProvider);
        });
        it('should fall back to defaultProvider when no defaultTest provider configured', async () => {
            const defaultProvider = {
                id: () => 'default-provider',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {},
            };
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, defaultProvider);
            expect(index_1.loadApiProvider).not.toHaveBeenCalled();
            expect(result).toBe(defaultProvider);
        });
        it('should fall back to defaultProvider when cliState.config is undefined', async () => {
            const defaultProvider = {
                id: () => 'default-provider',
                callApi: jest.fn(),
            };
            cliState_1.default.config = undefined;
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, defaultProvider);
            expect(index_1.loadApiProvider).not.toHaveBeenCalled();
            expect(result).toBe(defaultProvider);
        });
        it('should return null when no provider and no defaultProvider specified', async () => {
            cliState_1.default.config = {};
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            expect(result).toBeNull();
        });
        it('should work with full Azure provider configuration', async () => {
            const azureProvider = {
                id: () => 'azureopenai:chat:gpt-4o',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: {
                            id: 'azureopenai:chat:gpt-4o',
                            config: {
                                apiHost: 'https://my-resource.openai.azure.com',
                                apiKey: 'my-api-key',
                                deploymentName: 'gpt-4o',
                            },
                        },
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(azureProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, null);
            // Since we recursively call getGradingProvider, it delegates to loadFromProviderOptions
            // which calls loadApiProvider with the id and options structure
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('azureopenai:chat:gpt-4o', {
                options: {
                    id: 'azureopenai:chat:gpt-4o',
                    config: {
                        apiHost: 'https://my-resource.openai.azure.com',
                        apiKey: 'my-api-key',
                        deploymentName: 'gpt-4o',
                    },
                },
            });
            expect(result).toBe(azureProvider);
        });
    });
    describe('explicit provider takes precedence over defaultTest', () => {
        it('should use explicit provider over defaultTest.options.provider', async () => {
            const explicitProvider = {
                id: () => 'explicit-provider',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: 'azureopenai:chat:gpt-4',
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(explicitProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', 'openai:gpt-4o', null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4o');
            expect(result).toBe(explicitProvider);
        });
        it('should use explicit provider object over defaultTest', async () => {
            const explicitProvider = {
                id: () => 'explicit-provider',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: 'azureopenai:chat:gpt-4',
                    },
                },
            };
            const result = await (0, matchers_1.getGradingProvider)('text', explicitProvider, null);
            expect(index_1.loadApiProvider).not.toHaveBeenCalled();
            expect(result).toBe(explicitProvider);
        });
    });
    describe('error handling', () => {
        it('should throw error when provider is an array', async () => {
            const providerArray = ['openai:gpt-4'];
            await expect((0, matchers_1.getGradingProvider)('text', providerArray, null)).rejects.toThrow('Provider must be an object or string, but received an array');
        });
        it('should throw error for invalid provider definition', async () => {
            const invalidProvider = { foo: 'bar' };
            await expect((0, matchers_1.getGradingProvider)('text', invalidProvider, null)).rejects.toThrow("Invalid provider definition for output type 'text'");
        });
    });
    describe('backwards compatibility', () => {
        it('should maintain existing behavior when defaultTest not configured', async () => {
            const defaultProvider = {
                id: () => 'default-provider',
                callApi: jest.fn(),
            };
            // No defaultTest in config
            cliState_1.default.config = {};
            const result = await (0, matchers_1.getGradingProvider)('text', undefined, defaultProvider);
            expect(result).toBe(defaultProvider);
            expect(index_1.loadApiProvider).not.toHaveBeenCalled();
        });
        it('should maintain existing behavior with explicit provider', async () => {
            const explicitProvider = {
                id: () => 'explicit-provider',
                callApi: jest.fn(),
            };
            cliState_1.default.config = {
                defaultTest: {
                    options: {
                        provider: 'should-be-ignored',
                    },
                },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(explicitProvider);
            const result = await (0, matchers_1.getGradingProvider)('text', 'openai:gpt-4', null);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4');
            expect(result).toBe(explicitProvider);
        });
    });
});
//# sourceMappingURL=getGradingProvider.test.js.map