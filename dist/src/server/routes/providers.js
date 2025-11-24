"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const defaultProviders_1 = require("../../constants/defaultProviders");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const httpTransforms_1 = require("../../providers/httpTransforms");
const index_1 = require("../../providers/index");
const discover_1 = require("../../redteam/commands/discover");
const remoteGeneration_1 = require("../../redteam/remoteGeneration");
const index_2 = require("../../util/fetch/index");
const invariant_1 = __importDefault(require("../../util/invariant"));
const providers_1 = require("../../validators/providers");
const testProvider_1 = require("../../validators/testProvider");
const serverConfig_1 = require("../config/serverConfig");
exports.providersRouter = (0, express_1.Router)();
/**
 * GET /api/providers
 *
 * Returns the list of providers available in the eval creator UI.
 * If ui-providers.yaml exists in .promptfoo directory, returns those providers.
 * Otherwise returns the default list of ~600 providers.
 *
 * Response:
 * - providers: Array of provider options (can be string IDs or full config objects)
 * - hasCustomConfig: Boolean indicating if custom config exists
 */
exports.providersRouter.get('/', (_req, res) => {
    try {
        const serverProviders = (0, serverConfig_1.getAvailableProviders)();
        // If server has custom providers, use those; otherwise use defaults
        const providers = serverProviders.length > 0 ? serverProviders : defaultProviders_1.defaultProviders;
        const hasCustomConfig = serverProviders.length > 0;
        res.json({
            success: true,
            data: { providers, hasCustomConfig },
        });
    }
    catch (error) {
        logger_1.default.error('[GET /api/providers] Error loading providers', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to load providers',
        });
    }
});
/**
 * GET /api/providers/config-status
 *
 * Returns whether a custom provider configuration exists.
 * Used by redteam setup UI to determine whether to filter provider types.
 *
 * When custom config exists (hasCustomConfig: true), redteam setup restricts
 * provider types to: http, websocket, python, javascript for testing custom implementations.
 *
 * Response:
 * - hasCustomConfig: Boolean indicating if ui-providers.yaml exists with providers
 */
exports.providersRouter.get('/config-status', (_req, res) => {
    try {
        const serverProviders = (0, serverConfig_1.getAvailableProviders)();
        const hasCustomConfig = serverProviders.length > 0;
        res.json({
            success: true,
            data: { hasCustomConfig },
        });
    }
    catch (error) {
        logger_1.default.error('[GET /api/providers/config-status] Error loading config status', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to load provider config status',
        });
    }
});
// Validation schemas
const TestRequestTransformSchema = zod_1.z.object({
    transformCode: zod_1.z.string().optional(),
    prompt: zod_1.z.string(),
});
const TestResponseTransformSchema = zod_1.z.object({
    transformCode: zod_1.z.string().optional(),
    response: zod_1.z.string(),
});
const TestPayloadSchema = zod_1.z.object({
    prompt: zod_1.z.string().optional(),
    providerOptions: providers_1.ProviderOptionsSchema,
});
exports.providersRouter.post('/test', async (req, res) => {
    let payload;
    try {
        payload = TestPayloadSchema.parse(req.body);
    }
    catch (e) {
        res.status(400).json({ error: (0, zod_validation_error_1.fromZodError)(e).toString() });
        return;
    }
    const providerOptions = payload.providerOptions;
    (0, invariant_1.default)(payload.providerOptions.id, 'id is required');
    const loadedProvider = await (0, index_1.loadApiProvider)(providerOptions.id, {
        options: {
            ...providerOptions,
            config: {
                ...providerOptions.config,
                maxRetries: 1,
            },
        },
    });
    // Use refactored function with optional prompt
    const result = await (0, testProvider_1.testProviderConnectivity)(loadedProvider, payload.prompt);
    res.status(200).json({
        testResult: {
            success: result.success,
            message: result.message,
            error: result.error,
            changes_needed: result.analysis?.changes_needed,
            changes_needed_reason: result.analysis?.changes_needed_reason,
            changes_needed_suggestions: result.analysis?.changes_needed_suggestions,
        },
        providerResponse: result.providerResponse,
        transformedRequest: result.transformedRequest,
    });
});
exports.providersRouter.post('/discover', async (req, res) => {
    const body = req.body;
    let providerOptions;
    try {
        providerOptions = providers_1.ProviderOptionsSchema.parse(body);
    }
    catch (e) {
        res.status(400).json({ error: (0, zod_validation_error_1.fromZodError)(e).toString() });
        return;
    }
    (0, invariant_1.default)(providerOptions.id, 'Provider ID (`id`) is required');
    // Check that remote generation is enabled:
    if ((0, remoteGeneration_1.neverGenerateRemote)()) {
        res.status(400).json({ error: 'Requires remote generation be enabled.' });
        return;
    }
    try {
        const loadedProvider = await (0, index_1.loadApiProvider)(providerOptions.id, {
            options: providerOptions,
        });
        const result = await (0, discover_1.doTargetPurposeDiscovery)(loadedProvider, undefined, false);
        if (result) {
            res.json(result);
        }
        else {
            res.status(500).json({ error: "Discovery failed to discover the target's purpose." });
        }
    }
    catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger_1.default.error('Error calling target purpose discovery', {
            error: e,
            providerOptions,
        });
        res.status(500).json({ error: `Discovery failed: ${errorMessage}` });
        return;
    }
});
exports.providersRouter.post('/http-generator', async (req, res) => {
    const { requestExample, responseExample } = req.body;
    if (!requestExample) {
        res.status(400).json({ error: 'Request example is required' });
        return;
    }
    const HOST = (0, envars_1.getEnvString)('PROMPTFOO_CLOUD_API_URL', 'https://api.promptfoo.app');
    try {
        logger_1.default.debug('[POST /providers/http-generator] Calling HTTP provider generator API', {
            requestExamplePreview: requestExample?.substring(0, 200),
            hasResponseExample: !!responseExample,
        });
        const response = await (0, index_2.fetchWithProxy)(`${HOST}/api/v1/http-provider-generator`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestExample,
                responseExample,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger_1.default.error('[POST /providers/http-generator] Error from cloud API', {
                status: response.status,
                errorText,
            });
            res.status(response.status).json({
                error: `HTTP error! status: ${response.status}`,
                details: errorText,
            });
            return;
        }
        const data = await response.json();
        logger_1.default.debug('[POST /providers/http-generator] Successfully generated config');
        res.status(200).json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error('[POST /providers/http-generator] Error calling HTTP provider generator', {
            error,
        });
        res.status(500).json({
            error: 'Failed to generate HTTP configuration',
            details: errorMessage,
        });
    }
});
// Test request transform endpoint
exports.providersRouter.post('/test-request-transform', async (req, res) => {
    try {
        const { transformCode, prompt } = TestRequestTransformSchema.parse(req.body);
        // Treat empty string as undefined to show base behavior
        const normalizedTransformCode = transformCode && transformCode.trim() ? transformCode : undefined;
        // Use the actual HTTP provider's transform function
        const transformFn = await (0, httpTransforms_1.createTransformRequest)(normalizedTransformCode);
        const result = await transformFn(prompt, {}, { prompt: { raw: prompt, label: prompt }, vars: {} });
        // Check if result is completely empty (no value at all)
        if (result === null || result === undefined) {
            res.json({
                success: false,
                error: 'Transform returned null or undefined. Check your transform function. Did you forget to `return` the result?',
            });
            return;
        }
        // Return the result even if it's an empty string or other falsy value
        // as it might be intentional
        res.json({
            success: true,
            result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: (0, zod_validation_error_1.fromZodError)(error).toString(),
            });
            return;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error('[POST /providers/test-request-transform] Error', {
            error,
        });
        res.status(200).json({
            success: false,
            error: errorMessage,
        });
    }
});
// Test response transform endpoint
exports.providersRouter.post('/test-response-transform', async (req, res) => {
    try {
        const { transformCode, response: responseText } = TestResponseTransformSchema.parse(req.body);
        // Treat empty string as undefined to show base behavior
        const normalizedTransformCode = transformCode && transformCode.trim() ? transformCode : undefined;
        // Parse the response as JSON if possible
        let jsonData;
        try {
            jsonData = JSON.parse(responseText);
        }
        catch {
            jsonData = null;
        }
        // Use the actual HTTP provider's transform function
        const transformFn = await (0, httpTransforms_1.createTransformResponse)(normalizedTransformCode);
        const result = transformFn(jsonData, responseText);
        // Check if result is empty/null/undefined
        // The result is always a ProviderResponse object with an 'output' field
        const output = result?.output ?? result?.raw ?? result;
        // Check if both output and raw are empty
        if (output === null || output === undefined || output === '') {
            res.json({
                success: false,
                error: 'Transform returned empty result. Ensure that your sample response is correct, and check your extraction path or transform function are returning a valid result.',
                result: JSON.stringify(output),
            });
            return;
        }
        // If output is empty but raw has content, still return it as success
        // This handles cases where the result isn't a string but is still valid
        res.json({
            success: true,
            result: output,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: (0, zod_validation_error_1.fromZodError)(error).toString(),
            });
            return;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error('[POST /providers/test-response-transform] Error', {
            error,
        });
        res.status(200).json({
            success: false,
            error: errorMessage,
        });
    }
});
// Test multi-turn session functionality
exports.providersRouter.post('/test-session', async (req, res) => {
    const body = req.body;
    const { provider: providerOptions, sessionConfig } = body;
    try {
        const validatedProvider = providers_1.ProviderOptionsSchema.parse(providerOptions);
        (0, invariant_1.default)(validatedProvider.id, 'Provider ID is required');
        const loadedProvider = await (0, index_1.loadApiProvider)(validatedProvider.id, {
            options: {
                ...validatedProvider,
                config: {
                    ...validatedProvider.config,
                    maxRetries: 1,
                    sessionSource: sessionConfig?.sessionSource || validatedProvider.config?.sessionSource,
                    sessionParser: sessionConfig?.sessionParser || validatedProvider.config?.sessionParser,
                },
            },
        });
        // Use refactored function
        const result = await (0, testProvider_1.testProviderSession)(loadedProvider, sessionConfig);
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            success: false,
            message: `Failed to test session: ${errorMessage}`,
            error: errorMessage,
        });
    }
});
//# sourceMappingURL=providers.js.map