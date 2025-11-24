"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("../../src/cache");
const databricks_1 = require("../../src/providers/databricks");
const chat_1 = require("../../src/providers/openai/chat");
jest.mock('../../src/logger');
jest.mock('../../src/providers/openai/chat');
describe('Databricks Foundation Model APIs Provider', () => {
    const originalEnv = process.env;
    const workspaceUrl = 'https://test-workspace.cloud.databricks.com';
    const defaultOptions = {
        config: {
            workspaceUrl,
        },
    };
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        delete process.env.DATABRICKS_WORKSPACE_URL;
        delete process.env.DATABRICKS_TOKEN;
    });
    afterEach(async () => {
        await (0, cache_1.clearCache)();
        process.env = originalEnv;
    });
    describe('DatabricksMosaicAiChatCompletionProvider', () => {
        it('should create provider for a custom deployed endpoint', () => {
            const provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-custom-endpoint', defaultOptions);
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-custom-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: `${workspaceUrl}/serving-endpoints`,
                    apiKeyEnvar: 'DATABRICKS_TOKEN',
                }),
            }));
        });
        it('should create provider for a pay-per-token endpoint', () => {
            const options = {
                config: {
                    workspaceUrl,
                    isPayPerToken: true,
                },
            };
            const provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('databricks-meta-llama-3-3-70b-instruct', options);
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('databricks-meta-llama-3-3-70b-instruct', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: workspaceUrl,
                    apiKeyEnvar: 'DATABRICKS_TOKEN',
                }),
            }));
        });
        it('should create provider with workspace URL from environment variable', () => {
            process.env.DATABRICKS_WORKSPACE_URL = workspaceUrl;
            const options = {
                config: {},
            };
            const provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: `${workspaceUrl}/serving-endpoints`,
                    apiKeyEnvar: 'DATABRICKS_TOKEN',
                }),
            }));
        });
        it('should strip trailing slash from workspace URL', () => {
            const options = {
                config: {
                    workspaceUrl: `${workspaceUrl}/`,
                },
            };
            const _provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    apiBaseUrl: `${workspaceUrl}/serving-endpoints`,
                }),
            }));
        });
        it('should throw error when no workspace URL is provided', () => {
            const options = {
                config: {},
            };
            expect(() => new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options)).toThrow('Databricks workspace URL is required. Set it in the config or DATABRICKS_WORKSPACE_URL environment variable.');
        });
        it('should pass through environment variables', () => {
            const options = {
                config: {
                    workspaceUrl,
                },
                env: {
                    DATABRICKS_TOKEN: 'test-token',
                },
            };
            const provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                env: expect.objectContaining({
                    DATABRICKS_TOKEN: 'test-token',
                }),
            }));
        });
        it('should pass through OpenAI configuration options', () => {
            const options = {
                config: {
                    workspaceUrl,
                    temperature: 0.7,
                    max_tokens: 100,
                    top_p: 0.9,
                },
            };
            const provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(provider).toBeInstanceOf(chat_1.OpenAiChatCompletionProvider);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    temperature: 0.7,
                    max_tokens: 100,
                    top_p: 0.9,
                }),
            }));
        });
        it('should include usage context as extra body params', () => {
            const options = {
                config: {
                    workspaceUrl,
                    usageContext: {
                        project: 'test-project',
                        team: 'engineering',
                    },
                },
            };
            const _provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    extraBodyParams: {
                        usage_context: {
                            project: 'test-project',
                            team: 'engineering',
                        },
                    },
                }),
            }));
        });
        it('should merge usage context with existing extra body params', () => {
            const options = {
                config: {
                    workspaceUrl,
                    usageContext: {
                        project: 'test-project',
                    },
                    extraBodyParams: {
                        custom_param: 'value',
                    },
                },
            };
            const _provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    extraBodyParams: {
                        custom_param: 'value',
                        usage_context: {
                            project: 'test-project',
                        },
                    },
                }),
            }));
        });
        it('should pass through AI Gateway config', () => {
            const options = {
                config: {
                    workspaceUrl,
                    aiGatewayConfig: {
                        enableSafety: true,
                        piiHandling: 'mask',
                    },
                },
            };
            const _provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    aiGatewayConfig: {
                        enableSafety: true,
                        piiHandling: 'mask',
                    },
                }),
            }));
        });
        it('should use custom apiKeyEnvar if provided', () => {
            const options = {
                config: {
                    workspaceUrl,
                    apiKeyEnvar: 'CUSTOM_DATABRICKS_KEY',
                },
            };
            const _provider = new databricks_1.DatabricksMosaicAiChatCompletionProvider('my-endpoint', options);
            expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('my-endpoint', expect.objectContaining({
                config: expect.objectContaining({
                    apiKeyEnvar: 'CUSTOM_DATABRICKS_KEY',
                }),
            }));
        });
    });
    describe('getApiUrl method', () => {
        // Need to unmock for these specific tests
        beforeEach(() => {
            jest.unmock('../../src/providers/openai/chat');
            jest.resetModules();
        });
        it('should return custom URL for pay-per-token endpoints', async () => {
            // Re-import after unmocking
            const { DatabricksMosaicAiChatCompletionProvider: UnmockedProvider } = await Promise.resolve().then(() => __importStar(require('../../src/providers/databricks')));
            const options = {
                config: {
                    workspaceUrl,
                    isPayPerToken: true,
                },
            };
            const provider = new UnmockedProvider('databricks-meta-llama-3-3-70b-instruct', options);
            // Use type assertion to access protected method
            const url = provider.getApiUrl();
            expect(url).toBe(`${workspaceUrl}/serving-endpoints/databricks-meta-llama-3-3-70b-instruct/invocations`);
        });
        it('should use parent class URL for custom endpoints', async () => {
            // Re-import after unmocking
            const { DatabricksMosaicAiChatCompletionProvider: UnmockedProvider } = await Promise.resolve().then(() => __importStar(require('../../src/providers/databricks')));
            const provider = new UnmockedProvider('my-custom-endpoint', defaultOptions);
            // Since we're extending OpenAI provider, it should use the OpenAI URL pattern
            const url = provider.getApiUrl();
            // For custom endpoints, getApiUrl returns the base URL (apiBaseUrl)
            // The /chat/completions path is added later in the callApi method
            expect(url).toBe(`${workspaceUrl}/serving-endpoints`);
        });
    });
});
//# sourceMappingURL=databricks.test.js.map