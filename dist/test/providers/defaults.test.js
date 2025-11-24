"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const moderation_1 = require("../../src/providers/azure/moderation");
const defaults_1 = require("../../src/providers/defaults");
const ai_studio_1 = require("../../src/providers/google/ai.studio");
const vertex_1 = require("../../src/providers/google/vertex");
const defaults_2 = require("../../src/providers/mistral/defaults");
const defaults_3 = require("../../src/providers/openai/defaults");
jest.mock('../../src/providers/google/util', () => ({
    hasGoogleDefaultCredentials: jest.fn().mockResolvedValue(false),
}));
class MockProvider {
    constructor(id) {
        this.providerId = id;
    }
    id() {
        return this.providerId;
    }
    async callApi() {
        return {};
    }
}
(0, globals_1.describe)('Provider override tests', () => {
    const originalEnv = process.env;
    (0, globals_1.beforeEach)(() => {
        process.env = { ...originalEnv };
        (0, defaults_1.setDefaultCompletionProviders)(undefined);
        (0, defaults_1.setDefaultEmbeddingProviders)(undefined);
        delete process.env.OPENAI_API_KEY;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;
        delete process.env.PALM_API_KEY;
    });
    (0, globals_1.afterEach)(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });
    (0, globals_1.it)('should override all completion providers when setDefaultCompletionProviders is called', async () => {
        const mockProvider = new MockProvider('test-completion-provider');
        await (0, defaults_1.setDefaultCompletionProviders)(mockProvider);
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.gradingJsonProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.gradingProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.suggestionsProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.synthesizeProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.embeddingProvider.id()).not.toBe('test-completion-provider');
    });
    (0, globals_1.it)('should override embedding provider when setDefaultEmbeddingProviders is called', async () => {
        const mockProvider = new MockProvider('test-embedding-provider');
        await (0, defaults_1.setDefaultEmbeddingProviders)(mockProvider);
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.embeddingProvider.id()).toBe('test-embedding-provider');
        (0, globals_1.expect)(providers.gradingJsonProvider.id()).not.toBe('test-embedding-provider');
        (0, globals_1.expect)(providers.gradingProvider.id()).not.toBe('test-embedding-provider');
        (0, globals_1.expect)(providers.suggestionsProvider.id()).not.toBe('test-embedding-provider');
        (0, globals_1.expect)(providers.synthesizeProvider.id()).not.toBe('test-embedding-provider');
    });
    (0, globals_1.it)('should allow both completion and embedding provider overrides simultaneously', async () => {
        const mockCompletionProvider = new MockProvider('test-completion-provider');
        const mockEmbeddingProvider = new MockProvider('test-embedding-provider');
        await (0, defaults_1.setDefaultCompletionProviders)(mockCompletionProvider);
        await (0, defaults_1.setDefaultEmbeddingProviders)(mockEmbeddingProvider);
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.gradingJsonProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.gradingProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.suggestionsProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.synthesizeProvider.id()).toBe('test-completion-provider');
        (0, globals_1.expect)(providers.embeddingProvider.id()).toBe('test-embedding-provider');
    });
    (0, globals_1.it)('should use AzureModerationProvider when AZURE_CONTENT_SAFETY_ENDPOINT is set', async () => {
        process.env.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://test-endpoint.com';
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.moderationProvider).toBeInstanceOf(moderation_1.AzureModerationProvider);
        (0, globals_1.expect)(providers.moderationProvider.modelName).toBe('text-content-safety');
    });
    (0, globals_1.it)('should use DefaultModerationProvider when AZURE_CONTENT_SAFETY_ENDPOINT is not set', async () => {
        delete process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.moderationProvider).toBe(defaults_3.DefaultModerationProvider);
    });
    (0, globals_1.it)('should use AzureModerationProvider when AZURE_CONTENT_SAFETY_ENDPOINT is provided via env overrides', async () => {
        const envOverrides = {
            AZURE_CONTENT_SAFETY_ENDPOINT: 'https://test-endpoint.com',
        };
        const providers = await (0, defaults_1.getDefaultProviders)(envOverrides);
        (0, globals_1.expect)(providers.moderationProvider).toBeInstanceOf(moderation_1.AzureModerationProvider);
        (0, globals_1.expect)(providers.moderationProvider.modelName).toBe('text-content-safety');
    });
    (0, globals_1.it)('should use Azure moderation provider with custom configuration', async () => {
        const envOverrides = {
            AZURE_CONTENT_SAFETY_ENDPOINT: 'https://test-endpoint.com',
            AZURE_CONTENT_SAFETY_API_KEY: 'test-api-key',
            AZURE_CONTENT_SAFETY_API_VERSION: '2024-01-01',
        };
        const providers = await (0, defaults_1.getDefaultProviders)(envOverrides);
        (0, globals_1.expect)(providers.moderationProvider).toBeInstanceOf(moderation_1.AzureModerationProvider);
        const moderationProvider = providers.moderationProvider;
        (0, globals_1.expect)(moderationProvider.modelName).toBe('text-content-safety');
        (0, globals_1.expect)(moderationProvider.endpoint).toBe('https://test-endpoint.com');
        (0, globals_1.expect)(moderationProvider.apiVersion).toBe('2024-01-01');
    });
    (0, globals_1.it)('should use Mistral providers when MISTRAL_API_KEY is set', async () => {
        process.env.MISTRAL_API_KEY = 'test-key';
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.embeddingProvider).toBe(defaults_2.DefaultEmbeddingProvider);
        (0, globals_1.expect)(providers.gradingJsonProvider).toBe(defaults_2.DefaultGradingJsonProvider);
        (0, globals_1.expect)(providers.gradingProvider).toBe(defaults_2.DefaultGradingProvider);
        (0, globals_1.expect)(providers.suggestionsProvider).toBe(defaults_2.DefaultSuggestionsProvider);
        (0, globals_1.expect)(providers.synthesizeProvider).toBe(defaults_2.DefaultSynthesizeProvider);
    });
    (0, globals_1.it)('should use Mistral providers when provided via env overrides', async () => {
        const envOverrides = {
            MISTRAL_API_KEY: 'test-key',
        };
        const providers = await (0, defaults_1.getDefaultProviders)(envOverrides);
        (0, globals_1.expect)(providers.embeddingProvider).toBe(defaults_2.DefaultEmbeddingProvider);
        (0, globals_1.expect)(providers.gradingJsonProvider).toBe(defaults_2.DefaultGradingJsonProvider);
        (0, globals_1.expect)(providers.gradingProvider).toBe(defaults_2.DefaultGradingProvider);
        (0, globals_1.expect)(providers.suggestionsProvider).toBe(defaults_2.DefaultSuggestionsProvider);
        (0, globals_1.expect)(providers.synthesizeProvider).toBe(defaults_2.DefaultSynthesizeProvider);
    });
    (0, globals_1.it)('should not use Mistral providers when OpenAI credentials exist', async () => {
        process.env.MISTRAL_API_KEY = 'test-key';
        process.env.OPENAI_API_KEY = 'test-key';
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.embeddingProvider).not.toBe(defaults_2.DefaultEmbeddingProvider);
        (0, globals_1.expect)(providers.gradingJsonProvider).not.toBe(defaults_2.DefaultGradingJsonProvider);
        (0, globals_1.expect)(providers.gradingProvider).not.toBe(defaults_2.DefaultGradingProvider);
        (0, globals_1.expect)(providers.suggestionsProvider).not.toBe(defaults_2.DefaultSuggestionsProvider);
        (0, globals_1.expect)(providers.synthesizeProvider).not.toBe(defaults_2.DefaultSynthesizeProvider);
    });
    (0, globals_1.it)('should not use Mistral providers when Anthropic credentials exist', async () => {
        process.env.MISTRAL_API_KEY = 'test-key';
        process.env.ANTHROPIC_API_KEY = 'test-key';
        const providers = await (0, defaults_1.getDefaultProviders)();
        (0, globals_1.expect)(providers.embeddingProvider).not.toBe(defaults_2.DefaultEmbeddingProvider);
        (0, globals_1.expect)(providers.gradingJsonProvider).not.toBe(defaults_2.DefaultGradingJsonProvider);
        (0, globals_1.expect)(providers.gradingProvider).not.toBe(defaults_2.DefaultGradingProvider);
        (0, globals_1.expect)(providers.suggestionsProvider).not.toBe(defaults_2.DefaultSuggestionsProvider);
        (0, globals_1.expect)(providers.synthesizeProvider).not.toBe(defaults_2.DefaultSynthesizeProvider);
    });
    (0, globals_1.describe)('Google AI Studio provider selection', () => {
        (0, globals_1.it)('should use Google AI Studio providers when GEMINI_API_KEY is set', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.llmRubricProvider).toBe(ai_studio_1.DefaultLlmRubricProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
            (0, globals_1.expect)(providers.embeddingProvider).toBe(vertex_1.DefaultEmbeddingProvider); // Falls back to Vertex
        });
        (0, globals_1.it)('should use Google AI Studio providers when GOOGLE_API_KEY is set', async () => {
            process.env.GOOGLE_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.llmRubricProvider).toBe(ai_studio_1.DefaultLlmRubricProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
            (0, globals_1.expect)(providers.embeddingProvider).toBe(vertex_1.DefaultEmbeddingProvider); // Falls back to Vertex
        });
        (0, globals_1.it)('should use Google AI Studio providers when PALM_API_KEY is set', async () => {
            process.env.PALM_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.llmRubricProvider).toBe(ai_studio_1.DefaultLlmRubricProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
            (0, globals_1.expect)(providers.embeddingProvider).toBe(vertex_1.DefaultEmbeddingProvider); // Falls back to Vertex
        });
        (0, globals_1.it)('should use Google AI Studio providers when provided via env overrides', async () => {
            const envOverrides = {
                GEMINI_API_KEY: 'test-key',
            };
            const providers = await (0, defaults_1.getDefaultProviders)(envOverrides);
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.llmRubricProvider).toBe(ai_studio_1.DefaultLlmRubricProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
            (0, globals_1.expect)(providers.embeddingProvider).toBe(vertex_1.DefaultEmbeddingProvider); // Falls back to Vertex
        });
        (0, globals_1.it)('should not use Google AI Studio providers when OpenAI credentials exist', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            process.env.OPENAI_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).not.toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).not.toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).not.toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).not.toBe(ai_studio_1.DefaultSynthesizeProvider);
        });
        (0, globals_1.it)('should not use Google AI Studio providers when Anthropic credentials exist', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            process.env.ANTHROPIC_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).not.toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).not.toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).not.toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).not.toBe(ai_studio_1.DefaultSynthesizeProvider);
        });
        (0, globals_1.it)('should prefer Google AI Studio over Vertex when both credentials are available', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            // hasGoogleDefaultCredentials is mocked to return false, but in practice
            // AI Studio should be preferred over Vertex in the provider selection order
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
        });
        (0, globals_1.it)('should prefer Google AI Studio over Mistral when both credentials are available', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            process.env.MISTRAL_API_KEY = 'test-key';
            const providers = await (0, defaults_1.getDefaultProviders)();
            (0, globals_1.expect)(providers.gradingProvider).toBe(ai_studio_1.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).toBe(ai_studio_1.DefaultGradingJsonProvider);
            (0, globals_1.expect)(providers.suggestionsProvider).toBe(ai_studio_1.DefaultSuggestionsProvider);
            (0, globals_1.expect)(providers.synthesizeProvider).toBe(ai_studio_1.DefaultSynthesizeProvider);
            (0, globals_1.expect)(providers.gradingProvider).not.toBe(defaults_2.DefaultGradingProvider);
            (0, globals_1.expect)(providers.gradingJsonProvider).not.toBe(defaults_2.DefaultGradingJsonProvider);
        });
    });
});
//# sourceMappingURL=defaults.test.js.map