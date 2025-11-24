"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../src/providers/github/index");
const chat_1 = require("../../../src/providers/openai/chat");
jest.mock('../../../src/providers/openai/chat');
describe('createGitHubProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should create provider with default model when no model specified', () => {
        const mockProvider = { id: jest.fn().mockReturnValue('github:openai/gpt-4.1') };
        jest.mocked(chat_1.OpenAiChatCompletionProvider).mockReturnValue(mockProvider);
        const result = (0, index_1.createGitHubProvider)('github:', {}, {});
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-4.1', {
            config: {
                apiBaseUrl: 'https://models.github.ai',
                apiKeyEnvar: 'GITHUB_TOKEN',
            },
        });
        expect(result).toBe(mockProvider);
    });
    it('should create provider with specified model', () => {
        const mockProvider = { id: jest.fn().mockReturnValue('github:openai/gpt-4.1-mini') };
        jest.mocked(chat_1.OpenAiChatCompletionProvider).mockReturnValue(mockProvider);
        const result = (0, index_1.createGitHubProvider)('github:openai/gpt-4.1-mini', {}, {});
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-4.1-mini', {
            config: {
                apiBaseUrl: 'https://models.github.ai',
                apiKeyEnvar: 'GITHUB_TOKEN',
            },
        });
        expect(result).toBe(mockProvider);
    });
    it('should handle models with colons in their names', () => {
        const mockProvider = { id: jest.fn().mockReturnValue('github:anthropic/claude-3.5:sonnet') };
        jest.mocked(chat_1.OpenAiChatCompletionProvider).mockReturnValue(mockProvider);
        const result = (0, index_1.createGitHubProvider)('github:anthropic/claude-3.5:sonnet', {}, {});
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('anthropic/claude-3.5:sonnet', {
            config: {
                apiBaseUrl: 'https://models.github.ai',
                apiKeyEnvar: 'GITHUB_TOKEN',
            },
        });
        expect(result).toBe(mockProvider);
    });
    it('should merge existing config with GitHub-specific config', () => {
        const mockProvider = { id: jest.fn().mockReturnValue('github:openai/gpt-4.1') };
        jest.mocked(chat_1.OpenAiChatCompletionProvider).mockReturnValue(mockProvider);
        const existingConfig = {
            temperature: 0.7,
            max_tokens: 2048,
            apiKey: 'custom-key',
        };
        const result = (0, index_1.createGitHubProvider)('github:openai/gpt-4.1', { config: existingConfig }, {});
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-4.1', {
            config: {
                temperature: 0.7,
                max_tokens: 2048,
                apiKey: 'custom-key',
                apiBaseUrl: 'https://models.github.ai',
                apiKeyEnvar: 'GITHUB_TOKEN',
            },
        });
        expect(result).toBe(mockProvider);
    });
    it('should pass through all provider options', () => {
        const mockProvider = { id: jest.fn().mockReturnValue('github:openai/gpt-4.1') };
        jest.mocked(chat_1.OpenAiChatCompletionProvider).mockReturnValue(mockProvider);
        const providerOptions = {
            id: 'custom-id',
            label: 'Custom Label',
            config: { temperature: 0.5 },
            transform: 'output.trim()',
            delay: 1000,
        };
        const result = (0, index_1.createGitHubProvider)('github:openai/gpt-4.1', providerOptions, {});
        expect(chat_1.OpenAiChatCompletionProvider).toHaveBeenCalledWith('openai/gpt-4.1', {
            id: 'custom-id',
            label: 'Custom Label',
            transform: 'output.trim()',
            delay: 1000,
            config: {
                temperature: 0.5,
                apiBaseUrl: 'https://models.github.ai',
                apiKeyEnvar: 'GITHUB_TOKEN',
            },
        });
        expect(result).toBe(mockProvider);
    });
});
//# sourceMappingURL=index.test.js.map