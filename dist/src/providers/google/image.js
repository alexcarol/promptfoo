"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleImageProvider = void 0;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const time_1 = require("../../util/time");
const shared_1 = require("../shared");
const util_1 = require("./util");
class GoogleImageProvider {
    constructor(modelName, options = {}) {
        this.maxRetries = 3;
        this.baseRetryDelay = 1000; // 1 second
        this.modelName = modelName;
        this.config = options.config || {};
        this.env = options.env;
    }
    id() {
        return `google:image:${this.modelName}`;
    }
    toString() {
        return `[Google Image Generation Provider ${this.modelName}]`;
    }
    /**
     * Helper method to get Google client with credentials support
     */
    async getClientWithCredentials() {
        const credentials = (0, util_1.loadCredentials)(this.config.credentials);
        const { client } = await (0, util_1.getGoogleClient)({ credentials });
        return client;
    }
    async getProjectId() {
        return await (0, util_1.resolveProjectId)(this.config, this.env);
    }
    async callApi(prompt, _context) {
        if (!prompt) {
            return {
                error: 'Prompt is required for image generation',
            };
        }
        // Check if we should use Vertex AI (when projectId is provided)
        const projectId = this.config.projectId || (0, envars_1.getEnvString)('GOOGLE_PROJECT_ID') || this.env?.GOOGLE_PROJECT_ID;
        if (projectId) {
            // Use Vertex AI if project ID is available
            return this.callVertexApi(prompt);
        }
        // Otherwise, try Google AI Studio with API key
        const apiKey = this.getApiKey();
        if (apiKey) {
            return this.callGeminiApi(prompt);
        }
        // If neither is available, provide helpful error
        return {
            error: 'Imagen models require either:\n' +
                '1. Google AI Studio: Set GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GEMINI_API_KEY environment variable\n' +
                '2. Vertex AI: Set GOOGLE_PROJECT_ID environment variable or provide projectId in config, and run "gcloud auth application-default login"',
        };
    }
    async callVertexApi(prompt) {
        const location = this.config.region ||
            (0, envars_1.getEnvString)('GOOGLE_LOCATION') ||
            this.env?.GOOGLE_LOCATION ||
            'us-central1';
        try {
            const client = await this.getClientWithCredentials();
            const projectId = await this.getProjectId();
            if (!projectId) {
                return {
                    error: 'Google project ID is required for Vertex AI. Set GOOGLE_PROJECT_ID or add projectId to provider config.',
                };
            }
            const modelPath = this.getModelPath();
            const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelPath}:predict`;
            logger_1.default.debug(`Vertex AI Image API endpoint: ${endpoint}`);
            logger_1.default.debug(`Project ID: ${projectId}, Location: ${location}, Model: ${modelPath}`);
            const body = {
                instances: [
                    {
                        prompt: prompt.trim(),
                    },
                ],
                parameters: {
                    sampleCount: this.config.n || 1,
                    aspectRatio: this.config.aspectRatio || '1:1',
                    personGeneration: this.config.personGeneration || 'allow_all',
                    safetySetting: this.config.safetyFilterLevel || 'block_some',
                    addWatermark: this.config.addWatermark !== false,
                    // Only include seed if watermark is disabled, as they're incompatible
                    ...(this.config.seed !== undefined &&
                        this.config.addWatermark === false && { seed: this.config.seed }),
                },
            };
            const startTime = Date.now();
            const response = await this.withRetry(() => client.request({
                url: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.headers || {}),
                },
                data: body,
                timeout: shared_1.REQUEST_TIMEOUT_MS,
            }), 'Vertex AI API call');
            const latencyMs = Date.now() - startTime;
            return this.processResponse(response.data, false, latencyMs);
        }
        catch (err) {
            if (err.response?.data?.error) {
                return {
                    error: `Vertex AI error: ${err.response.data.error.message || 'Unknown error'}`,
                };
            }
            return {
                error: `Failed to call Vertex AI: ${err.message || 'Unknown error'}`,
            };
        }
    }
    async callGeminiApi(prompt) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            return {
                error: 'API key not found. Set GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GEMINI_API_KEY environment variable.',
            };
        }
        const modelPath = this.getModelPath();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelPath}:predict`;
        logger_1.default.debug(`Google AI Studio Image API endpoint: ${endpoint}`);
        // Map the safety filter level for Google AI Studio
        const safetySetting = this.mapSafetyLevelForGemini(this.config.safetyFilterLevel);
        const body = {
            instances: [
                {
                    prompt: prompt.trim(),
                },
            ],
            parameters: {
                sampleCount: this.config.n || 1,
                aspectRatio: this.config.aspectRatio || '1:1',
                personGeneration: this.config.personGeneration || 'allow_all',
                safetySetting,
                // Google AI Studio doesn't support addWatermark or seed parameters
            },
        };
        logger_1.default.debug(`Making request to ${endpoint} with API key`);
        try {
            const response = await this.withRetry(() => (0, cache_1.fetchWithCache)(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                    ...(this.config.headers || {}),
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json'), 'Google AI Studio API call');
            return this.processResponse(response.data, response.cached, response.latencyMs);
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
    }
    processResponse(data, cached, latencyMs) {
        logger_1.default.debug(`Response data: ${JSON.stringify(data).substring(0, 200)}...`);
        if (!data || typeof data !== 'object') {
            return {
                error: 'Invalid response from API',
            };
        }
        if (data.error) {
            return {
                error: data.error.message || JSON.stringify(data.error),
            };
        }
        if (!data.predictions || data.predictions.length === 0) {
            return {
                error: 'No images generated',
            };
        }
        const imageOutputs = [];
        let totalCost = 0;
        // Get cost per image from model prices
        const costPerImage = this.getCost();
        for (const prediction of data.predictions) {
            // Handle both response structures (Vertex AI and Google AI Studio)
            const imageData = prediction.image || prediction;
            const base64Image = imageData.bytesBase64Encoded;
            const mimeType = imageData.mimeType || 'image/png';
            if (base64Image) {
                // Return as markdown image with data URL
                imageOutputs.push(`![Generated Image](data:${mimeType};base64,${base64Image})`);
                totalCost += costPerImage;
            }
        }
        if (imageOutputs.length === 0) {
            return {
                error: 'No valid images generated',
            };
        }
        return {
            output: imageOutputs.join('\n\n'),
            cached,
            latencyMs,
            cost: totalCost,
        };
    }
    mapSafetyLevelForGemini(level) {
        // Google AI Studio only supports 'block_low_and_above'
        // Document this limitation in the response if user specified a different level
        if (level && level !== 'block_low_and_above') {
            logger_1.default.warn(`Google AI Studio only supports 'block_low_and_above' safety setting. Requested setting '${level}' will be overridden.`);
        }
        return 'block_low_and_above';
    }
    getApiKey() {
        return (this.config.apiKey ||
            (0, envars_1.getEnvString)('GOOGLE_API_KEY') ||
            (0, envars_1.getEnvString)('GOOGLE_GENERATIVE_AI_API_KEY') ||
            (0, envars_1.getEnvString)('GEMINI_API_KEY') ||
            this.env?.GOOGLE_API_KEY ||
            this.env?.GOOGLE_GENERATIVE_AI_API_KEY ||
            this.env?.GEMINI_API_KEY);
    }
    getModelPath() {
        // If model already starts with 'imagen-' prefix, use it as is
        if (this.modelName.startsWith('imagen-')) {
            return this.modelName;
        }
        // Otherwise prepend imagen- prefix
        return `imagen-${this.modelName}`;
    }
    getCost() {
        // Cost per image based on model
        const costMap = {
            'imagen-4.0-ultra-generate-preview-06-06': 0.06,
            'imagen-4.0-generate-preview-06-06': 0.04,
            'imagen-4.0-fast-generate-preview-06-06': 0.02,
            'imagen-3.0-generate-002': 0.04,
            'imagen-3.0-generate-001': 0.04,
            'imagen-3.0-fast-generate-001': 0.02,
        };
        // Use the normalized model path for cost lookup
        const modelPath = this.getModelPath();
        return costMap[modelPath] || 0.04; // Default cost
    }
    async withRetry(operation, operationName) {
        let lastError;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Don't retry on client errors (4xx)
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    throw error;
                }
                // Don't retry on the last attempt
                if (attempt === this.maxRetries - 1) {
                    throw error;
                }
                const delay = this.baseRetryDelay * Math.pow(2, attempt);
                logger_1.default.warn(`${operationName} failed (attempt ${attempt + 1}/${this.maxRetries}), retrying in ${delay}ms...`);
                await (0, time_1.sleep)(delay);
            }
        }
        throw lastError;
    }
}
exports.GoogleImageProvider = GoogleImageProvider;
//# sourceMappingURL=image.js.map