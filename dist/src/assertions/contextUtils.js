"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveContext = resolveContext;
exports.serializeContext = serializeContext;
const invariant_1 = __importDefault(require("../util/invariant"));
const transform_1 = require("../util/transform");
/**
 * Resolves the context value for context-based assertions.
 * Supports extracting context from test variables or transforming from output.
 * Can return either a single context string or an array of context chunks.
 *
 * @param assertion - The assertion configuration
 * @param test - The test case
 * @param output - The provider output (after provider transform, before test transform)
 * @param prompt - The prompt text
 * @param fallbackContext - Optional fallback context (e.g., prompt for context-recall)
 * @param providerResponse - Optional full provider response for contextTransform
 * @returns The resolved context string or array of strings
 * @throws Error if context cannot be resolved or transform fails
 */
async function resolveContext(assertion, test, output, prompt, fallbackContext, providerResponse) {
    // Handle context from test variables - support both string and string array
    let contextValue;
    if (test.vars?.context) {
        if (typeof test.vars.context === 'string') {
            contextValue = test.vars.context;
        }
        else if (Array.isArray(test.vars.context)) {
            const invalidEntry = [...test.vars.context.entries()].find(([, v]) => typeof v !== 'string');
            if (invalidEntry) {
                const [idx, val] = invalidEntry;
                (0, invariant_1.default)(false, `Invalid context: expected an array of strings, but found ${typeof val} at index ${idx}`);
            }
            contextValue = test.vars.context;
        }
    }
    else if (fallbackContext) {
        contextValue = fallbackContext;
    }
    if (assertion.contextTransform) {
        try {
            // Use providerTransformedOutput if available
            // Otherwise fall back to output for backwards compatibility
            const outputForTransform = providerResponse?.providerTransformedOutput ?? output;
            const transformed = await (0, transform_1.transform)(assertion.contextTransform, outputForTransform, {
                vars: test.vars,
                prompt: { label: prompt },
                ...(providerResponse &&
                    providerResponse.metadata && { metadata: providerResponse.metadata }),
            });
            (0, invariant_1.default)(typeof transformed === 'string' ||
                (Array.isArray(transformed) && transformed.every((item) => typeof item === 'string')), `contextTransform must return a string or array of strings. Got ${typeof transformed}. ` +
                `Check your transform expression: ${assertion.contextTransform}`);
            contextValue = transformed;
        }
        catch (error) {
            throw new Error(`Failed to transform context using expression '${assertion.contextTransform}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    (0, invariant_1.default)((typeof contextValue === 'string' && contextValue.length > 0) ||
        (Array.isArray(contextValue) &&
            contextValue.length > 0 &&
            contextValue.every((item) => typeof item === 'string' && item.length > 0)), 'Context is required for context-based assertions. ' +
        'Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" ' +
        'to extract context from the provider response.');
    return contextValue;
}
/**
 * Serializes context (string or string[]) to a single string for prompts.
 * Joins chunks with double newlines to preserve separation.
 */
function serializeContext(context) {
    return Array.isArray(context) ? context.join('\n\n') : context;
}
//# sourceMappingURL=contextUtils.js.map