"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHttpProvider = isHttpProvider;
exports.patchHttpConfigForValidation = patchHttpConfigForValidation;
/**
 * Check if a provider is an HTTP provider
 */
function isHttpProvider(provider) {
    // Check if the provider has the HttpProvider class name or url property
    const providerId = typeof provider.id === 'function' ? provider.id() : provider.id || '';
    return providerId.startsWith('http:') || providerId.startsWith('https:');
}
/**
 * Patch HTTP provider config for validation.
 * We need to set maxRetries to 1 and add a silent header to avoid excessive logging of the request and response.
 */
function patchHttpConfigForValidation(providerOptions) {
    return {
        ...providerOptions,
        config: {
            ...providerOptions.config,
            maxRetries: 1,
            headers: {
                ...providerOptions.config?.headers,
                'x-promptfoo-silent': 'true',
            },
        },
    };
}
//# sourceMappingURL=httpProvider.js.map