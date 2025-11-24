"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGitHubReasoningProvider = exports.DefaultGitHubBalancedProvider = exports.DefaultGitHubFastProvider = exports.DefaultGitHubSuggestionsProvider = exports.DefaultGitHubGradingJsonProvider = exports.DefaultGitHubGradingProvider = void 0;
const chat_1 = require("../openai/chat");
// GitHub Models default providers
// Using OpenAI-compatible API with GitHub's endpoint
const githubConfig = {
    apiBaseUrl: 'https://models.github.ai',
    apiKeyEnvar: 'GITHUB_TOKEN',
};
exports.DefaultGitHubGradingProvider = new chat_1.OpenAiChatCompletionProvider('openai/gpt-4.1', {
    config: githubConfig,
});
exports.DefaultGitHubGradingJsonProvider = new chat_1.OpenAiChatCompletionProvider('openai/gpt-4.1', {
    config: {
        ...githubConfig,
        response_format: { type: 'json_object' },
    },
});
exports.DefaultGitHubSuggestionsProvider = new chat_1.OpenAiChatCompletionProvider('openai/gpt-4.1', {
    config: githubConfig,
});
// Fast model for quick evaluations
exports.DefaultGitHubFastProvider = new chat_1.OpenAiChatCompletionProvider('openai/gpt-4.1-nano', {
    config: githubConfig,
});
// Balanced model for general use
exports.DefaultGitHubBalancedProvider = new chat_1.OpenAiChatCompletionProvider('openai/gpt-4.1-mini', {
    config: githubConfig,
});
// Reasoning model for complex evaluations
exports.DefaultGitHubReasoningProvider = new chat_1.OpenAiChatCompletionProvider('openai/o3-mini', {
    config: githubConfig,
});
//# sourceMappingURL=defaults.js.map