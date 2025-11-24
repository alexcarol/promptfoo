"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ai_studio_1 = require("../../../src/providers/google/ai.studio");
(0, globals_1.describe)('Google AI Studio Default Providers', () => {
    (0, globals_1.it)('should have correct model names', () => {
        (0, globals_1.expect)(ai_studio_1.DefaultGradingProvider.id()).toBe('google:gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultGradingJsonProvider.id()).toBe('google:gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultLlmRubricProvider.id()).toBe('google:gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultSuggestionsProvider.id()).toBe('google:gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultSynthesizeProvider.id()).toBe('google:gemini-2.5-pro');
    });
    (0, globals_1.it)('should use gemini-2.5-pro as the default model', () => {
        (0, globals_1.expect)(ai_studio_1.DefaultGradingProvider.modelName).toBe('gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultGradingJsonProvider.modelName).toBe('gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultLlmRubricProvider.modelName).toBe('gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultSuggestionsProvider.modelName).toBe('gemini-2.5-pro');
        (0, globals_1.expect)(ai_studio_1.DefaultSynthesizeProvider.modelName).toBe('gemini-2.5-pro');
    });
    (0, globals_1.it)('should configure JSON provider with correct response format', () => {
        (0, globals_1.expect)(ai_studio_1.DefaultGradingJsonProvider.config.generationConfig?.response_mime_type).toBe('application/json');
    });
    (0, globals_1.it)('should not configure JSON response format for non-JSON providers', () => {
        (0, globals_1.expect)(ai_studio_1.DefaultGradingProvider.config.generationConfig?.response_mime_type).toBeUndefined();
        (0, globals_1.expect)(ai_studio_1.DefaultLlmRubricProvider.config.generationConfig?.response_mime_type).toBeUndefined();
        (0, globals_1.expect)(ai_studio_1.DefaultSuggestionsProvider.config.generationConfig?.response_mime_type).toBeUndefined();
        (0, globals_1.expect)(ai_studio_1.DefaultSynthesizeProvider.config.generationConfig?.response_mime_type).toBeUndefined();
    });
});
//# sourceMappingURL=ai.studio.defaults.test.js.map