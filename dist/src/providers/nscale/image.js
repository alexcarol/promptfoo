"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NscaleImageProvider = void 0;
exports.createNscaleImageProvider = createNscaleImageProvider;
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const invariant_1 = __importDefault(require("../../util/invariant"));
const image_1 = require("../openai/image");
const shared_1 = require("../shared");
/**
 * Nscale image generation provider.
 *
 * Provides text-to-image generation capabilities using Nscale's Serverless Inference API.
 * Supports various image models including Flux.1 Schnell, SDXL Lightning, and Stable Diffusion XL.
 *
 * Authentication uses service tokens (preferred) or API keys.
 * Defaults to base64 JSON response format for compatibility with Nscale API.
 */
class NscaleImageProvider extends image_1.OpenAiImageProvider {
    /**
     * Create a new Nscale image provider instance.
     *
     * @param modelName - The Nscale image model name (e.g., 'ByteDance/SDXL-Lightning-4step')
     * @param options - Provider configuration options
     */
    constructor(modelName, options = {}) {
        const nscaleConfig = options.config || {};
        super(modelName, {
            ...options,
            config: {
                ...nscaleConfig,
                apiBaseUrl: 'https://inference.api.nscale.com/v1',
                apiKey: NscaleImageProvider.getApiKey(options),
            }, // Use type assertion since Nscale supports OpenAI-compatible parameters
        });
        this.config = nscaleConfig;
    }
    /**
     * Retrieves the API key for authentication with Nscale API.
     * Prefers service tokens over API keys as API keys are deprecated as of Oct 30, 2025.
     *
     * @param options - Configuration and environment options
     * @returns The API key or service token, or undefined if not found
     */
    static getApiKey(options) {
        const config = options.config || {};
        // Prefer service tokens over API keys (API keys deprecated Oct 30, 2025)
        return (config.apiKey ||
            options.env?.NSCALE_SERVICE_TOKEN ||
            (0, envars_1.getEnvString)('NSCALE_SERVICE_TOKEN') ||
            options.env?.NSCALE_API_KEY ||
            (0, envars_1.getEnvString)('NSCALE_API_KEY'));
    }
    /**
     * Gets the API key for this provider instance.
     *
     * @returns The API key or service token, or undefined if not found
     */
    getApiKey() {
        return this.config?.apiKey || NscaleImageProvider.getApiKey({ config: this.config });
    }
    /**
     * Gets the default API URL for Nscale image generation endpoint.
     *
     * @returns The default Nscale API base URL
     */
    getApiUrlDefault() {
        return 'https://inference.api.nscale.com/v1';
    }
    /**
     * Gets the unique identifier for this provider instance.
     *
     * @returns Provider ID in the format "nscale:image:{modelName}"
     */
    id() {
        return `nscale:image:${this.modelName}`;
    }
    /**
     * Gets a string representation of this provider.
     *
     * @returns Human-readable provider description
     */
    toString() {
        return `[Nscale Image Provider ${this.modelName}]`;
    }
    /**
     * Calculates the cost for generating images with the specified model.
     * Pricing is based on Nscale's pricing page and varies by model.
     *
     * @param modelName - The name of the image generation model
     * @param n - Number of images to generate (default: 1)
     * @returns The estimated cost in USD
     */
    calculateImageCost(modelName, n = 1) {
        // Nscale pricing varies by model - these are approximate based on their pricing page
        const costPerImage = {
            'BlackForestLabs/FLUX.1-schnell': 0.0013, // $0.0013 per 1M pixels for 1024x1024
            'stabilityai/stable-diffusion-xl-base-1.0': 0.003, // $0.003 per 1M pixels
            'ByteDance/SDXL-Lightning-4step': 0.0008, // $0.0008 per 1M pixels
            'ByteDance/SDXL-Lightning-8step': 0.0016, // $0.0016 per 1M pixels
        };
        const baseCost = costPerImage[modelName] || 0.002; // Default cost
        return baseCost * n;
    }
    async callApi(prompt, context, _callApiOptions) {
        if (!this.getApiKey()) {
            throw new Error('Nscale service token is not set. Set the NSCALE_SERVICE_TOKEN environment variable or add `apiKey` to the provider config.');
        }
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const model = this.modelName;
        const responseFormat = config.response_format || 'b64_json'; // Default to b64_json for Nscale
        const endpoint = '/images/generations';
        const body = {
            model,
            prompt,
            n: config.n || 1,
            response_format: responseFormat,
        };
        if (config.size) {
            body.size = config.size;
        }
        if (config.user) {
            body.user = config.user;
        }
        const headers = {
            'Content-Type': 'application/json',
            ...(this.getApiKey() ? { Authorization: `Bearer ${this.getApiKey()}` } : {}),
            ...config.headers,
        };
        let data, status, statusText;
        let cached = false;
        try {
            ({ data, cached, status, statusText } = await (0, image_1.callOpenAiImageApi)(`${this.getApiUrl()}${endpoint}`, body, headers, shared_1.REQUEST_TIMEOUT_MS));
            if (status < 200 || status >= 300) {
                return {
                    error: `API error: ${status} ${statusText}\n${typeof data === 'string' ? data : JSON.stringify(data)}`,
                };
            }
        }
        catch (err) {
            logger_1.default.error(`API call error: ${String(err)}`);
            await data?.deleteFromCache?.();
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        if (data.error) {
            await data?.deleteFromCache?.();
            return {
                error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
            };
        }
        try {
            const formattedOutput = (0, image_1.formatOutput)(data, prompt, responseFormat);
            if (typeof formattedOutput === 'object') {
                return formattedOutput;
            }
            const cost = cached ? 0 : this.calculateImageCost(this.modelName, config.n || 1);
            return {
                output: formattedOutput,
                cached,
                cost,
                ...(responseFormat === 'b64_json' ? { isBase64: true, format: 'json' } : {}),
            };
        }
        catch (err) {
            await data?.deleteFromCache?.();
            return {
                error: `API error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
}
exports.NscaleImageProvider = NscaleImageProvider;
/**
 * Factory function to create a new Nscale image provider instance.
 * Parses the provider path to extract the model name and creates the provider.
 *
 * @param providerPath - Provider path in format "nscale:image:modelName"
 * @param options - Configuration options for the provider
 * @returns A new NscaleImageProvider instance
 * @throws Error if model name is missing from the provider path
 */
function createNscaleImageProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(2).join(':');
    (0, invariant_1.default)(modelName, 'Model name is required');
    return new NscaleImageProvider(modelName, options);
}
//# sourceMappingURL=image.js.map