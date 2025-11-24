"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGitHubProvider = createGitHubProvider;
const chat_1 = require("../openai/chat");
function createGitHubProvider(providerPath, providerOptions, _context) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(1).join(':') || 'openai/gpt-4.1';
    return new chat_1.OpenAiChatCompletionProvider(modelName, {
        ...providerOptions,
        config: {
            ...providerOptions.config,
            apiBaseUrl: 'https://models.github.ai',
            apiKeyEnvar: 'GITHUB_TOKEN',
        },
    });
}
//# sourceMappingURL=index.js.map