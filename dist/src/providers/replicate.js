"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateImageProvider = exports.DefaultModerationProvider = exports.LLAMAGUARD_3_MODEL_ID = exports.LLAMAGUARD_4_MODEL_ID = exports.ReplicateModerationProvider = exports.LLAMAGUARD_DESCRIPTIONS = exports.ReplicateProvider = void 0;
const cache_1 = require("../cache");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const shared_1 = require("../providers/shared");
const json_1 = require("../util/json");
const text_1 = require("../util/text");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
const shared_2 = require("./shared");
class ReplicateProvider {
    constructor(modelName, options = {}) {
        const { config, id, env } = options;
        this.modelName = modelName;
        this.apiKey =
            config?.apiKey ||
                env?.REPLICATE_API_KEY ||
                env?.REPLICATE_API_TOKEN ||
                (0, envars_1.getEnvString)('REPLICATE_API_TOKEN') ||
                (0, envars_1.getEnvString)('REPLICATE_API_KEY');
        this.config = config || {};
        this.id = id ? () => id : this.id;
    }
    id() {
        return `replicate:${this.modelName}`;
    }
    toString() {
        return `[Replicate Provider ${this.modelName}]`;
    }
    async callApi(prompt) {
        if (!this.apiKey) {
            throw new Error('Replicate API key is not set. Set the REPLICATE_API_TOKEN environment variable or or add `apiKey` to the provider config.');
        }
        if (this.config.prompt?.prefix) {
            prompt = this.config.prompt.prefix + prompt;
        }
        if (this.config.prompt?.suffix) {
            prompt = prompt + this.config.prompt.suffix;
        }
        let cache;
        let cacheKey;
        if ((0, cache_1.isCacheEnabled)()) {
            cache = await (0, cache_1.getCache)();
            cacheKey = `replicate:${this.modelName}:${JSON.stringify(this.config)}:${prompt}`;
            // Try to get the cached response
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Returning cached response for ${prompt}: ${cachedResponse}`);
                return JSON.parse(cachedResponse);
            }
        }
        const messages = (0, shared_2.parseChatPrompt)(prompt, [{ role: 'user', content: prompt }]);
        const systemPrompt = messages.find((message) => message.role === 'system')?.content ||
            this.config.system_prompt ||
            (0, envars_1.getEnvString)('REPLICATE_SYSTEM_PROMPT');
        const userPrompt = messages.find((message) => message.role === 'user')?.content || prompt;
        logger_1.default.debug(`Calling Replicate: ${prompt}`);
        let response;
        try {
            const inputOptions = {
                max_length: this.config.max_length || (0, envars_1.getEnvInt)('REPLICATE_MAX_LENGTH'),
                max_new_tokens: this.config.max_new_tokens || (0, envars_1.getEnvInt)('REPLICATE_MAX_NEW_TOKENS'),
                temperature: this.config.temperature || (0, envars_1.getEnvFloat)('REPLICATE_TEMPERATURE'),
                top_p: this.config.top_p || (0, envars_1.getEnvFloat)('REPLICATE_TOP_P'),
                top_k: this.config.top_k || (0, envars_1.getEnvInt)('REPLICATE_TOP_K'),
                repetition_penalty: this.config.repetition_penalty || (0, envars_1.getEnvFloat)('REPLICATE_REPETITION_PENALTY'),
                stop_sequences: this.config.stop_sequences || (0, envars_1.getEnvString)('REPLICATE_STOP_SEQUENCES'),
                seed: this.config.seed || (0, envars_1.getEnvInt)('REPLICATE_SEED'),
                system_prompt: systemPrompt,
                prompt: userPrompt,
            };
            const data = {
                version: this.modelName.includes(':') ? this.modelName.split(':')[1] : undefined,
                input: {
                    ...this.config,
                    ...Object.fromEntries(Object.entries(inputOptions).filter(([_, v]) => v !== undefined)),
                },
            };
            // Create prediction with sync mode (wait up to 60 seconds)
            const createResponse = await (0, cache_1.fetchWithCache)(this.modelName.includes(':')
                ? 'https://api.replicate.com/v1/predictions'
                : `https://api.replicate.com/v1/models/${this.modelName}/predictions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'wait=60',
                },
                body: JSON.stringify(data),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json');
            response = createResponse.data;
            // If still processing, poll for completion
            if (response.status === 'starting' || response.status === 'processing') {
                response = await this.pollForCompletion(response.id);
            }
            if (response.status === 'failed') {
                throw new Error(response.error || 'Prediction failed');
            }
            response = response.output;
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        logger_1.default.debug(`\tReplicate API response: ${JSON.stringify(response)}`);
        if (typeof response === 'string') {
            // It's text
            return {
                output: response,
                tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
            };
        }
        else if (Array.isArray(response)) {
            // It's a list of generative outputs
            if (response.every((item) => typeof item === 'string')) {
                const output = response.join('');
                const ret = {
                    output,
                    tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
                };
                if (cache && cacheKey) {
                    try {
                        await cache.set(cacheKey, JSON.stringify(ret));
                    }
                    catch (err) {
                        logger_1.default.error(`Failed to cache response: ${String(err)}`);
                    }
                }
                return ret;
            }
        }
        logger_1.default.error('Unsupported response from Replicate: ' + JSON.stringify(response));
        return {
            error: 'Unsupported response from Replicate: ' + JSON.stringify(response),
        };
    }
    async pollForCompletion(predictionId) {
        const maxPolls = 30; // Max 30 seconds of polling
        const pollInterval = 1000; // 1 second
        for (let i = 0; i < maxPolls; i++) {
            const pollResponse = await (0, cache_1.fetchWithCache)(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', false);
            const prediction = pollResponse.data;
            if (prediction.status === 'succeeded' ||
                prediction.status === 'failed' ||
                prediction.status === 'canceled') {
                return prediction;
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        throw new Error('Prediction timed out');
    }
}
exports.ReplicateProvider = ReplicateProvider;
// Map of LlamaGuard category codes to descriptions
// Supports both LlamaGuard 3 (S1-S13) and LlamaGuard 4 (S1-S14)
exports.LLAMAGUARD_DESCRIPTIONS = {
    S1: 'Violent Crimes',
    S2: 'Non-Violent Crimes',
    S3: 'Sex Crimes',
    S4: 'Child Exploitation',
    S5: 'Defamation',
    S6: 'Specialized Advice',
    S7: 'Privacy',
    S8: 'Intellectual Property',
    S9: 'Indiscriminate Weapons',
    S10: 'Hate',
    S11: 'Self-Harm',
    S12: 'Sexual Content',
    S13: 'Elections',
    S14: 'Code Interpreter Abuse', // LlamaGuard 4 only
};
class ReplicateModerationProvider extends ReplicateProvider {
    async callModerationApi(prompt, assistant) {
        try {
            const response = await this.callApi(`Human: ${prompt}\n\nAssistant: ${assistant}`);
            if (response.error) {
                return { error: response.error };
            }
            const { output } = response;
            if (!output || typeof output !== 'string') {
                return { error: `Invalid moderation response: ${JSON.stringify(output)}` };
            }
            // Parse the LlamaGuard output format
            const lines = output.trim().split('\n');
            const verdict = lines[0];
            if (verdict === 'safe') {
                return { flags: [] };
            }
            // Parse unsafe categories
            const flags = [];
            // LlamaGuard may return categories on the second line as comma-separated values
            if (lines.length > 1) {
                const categoriesLine = lines[1].trim();
                const categories = categoriesLine.split(',').map((cat) => cat.trim());
                for (const category of categories) {
                    if (category && exports.LLAMAGUARD_DESCRIPTIONS[category]) {
                        flags.push({
                            code: category,
                            description: exports.LLAMAGUARD_DESCRIPTIONS[category],
                            confidence: 1.0,
                        });
                    }
                }
            }
            return { flags };
        }
        catch (err) {
            return { error: `Invalid moderation response: ${String(err)}` };
        }
    }
}
exports.ReplicateModerationProvider = ReplicateModerationProvider;
// LlamaGuard 4 is the preferred default on Replicate
// LlamaGuard 4 adds S14: Code Interpreter Abuse category for enhanced safety
exports.LLAMAGUARD_4_MODEL_ID = 'meta/llama-guard-4-12b';
exports.LLAMAGUARD_3_MODEL_ID = 'meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8';
exports.DefaultModerationProvider = new ReplicateModerationProvider(exports.LLAMAGUARD_4_MODEL_ID);
class ReplicateImageProvider extends ReplicateProvider {
    constructor(modelName, options = {}) {
        super(modelName, options);
    }
    async callApi(prompt, context, _callApiOptions) {
        const cache = (0, cache_1.getCache)();
        const cacheKey = `replicate:image:${(0, json_1.safeJsonStringify)({ context, prompt })}`;
        if (!this.apiKey) {
            throw new Error('Replicate API key is not set. Set the REPLICATE_API_TOKEN environment variable or add `apiKey` to the provider config.');
        }
        let response;
        let cached = false;
        if ((0, cache_1.isCacheEnabled)()) {
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Retrieved cached response for ${prompt}: ${cachedResponse}`);
                response = JSON.parse(cachedResponse);
                cached = true;
            }
        }
        if (!response) {
            const input = {
                prompt,
                width: this.config.width || 768,
                height: this.config.height || 768,
            };
            // Add other config options, excluding internal ones
            Object.keys(this.config).forEach((key) => {
                if (!['apiKey', 'width', 'height'].includes(key)) {
                    input[key] = this.config[key];
                }
            });
            const data = { input };
            // Only add version if it's provided explicitly
            if (this.modelName.includes(':')) {
                data.version = this.modelName.split(':')[1];
            }
            // Create prediction with sync mode
            const createResponse = await (0, cache_1.fetchWithCache)(this.modelName.includes(':')
                ? 'https://api.replicate.com/v1/predictions'
                : `https://api.replicate.com/v1/models/${this.modelName}/predictions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'wait=60',
                },
                body: JSON.stringify(data),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json');
            let prediction = createResponse.data;
            logger_1.default.debug(`Initial prediction status: ${prediction.status}, ID: ${prediction.id}`);
            // If still processing, poll for completion
            if (prediction.status === 'starting' || prediction.status === 'processing') {
                prediction = await this.pollForCompletion(prediction.id);
            }
            logger_1.default.debug(`Final prediction status: ${prediction.status}, output: ${JSON.stringify(prediction.output)}`);
            if (prediction.status === 'failed') {
                return {
                    error: prediction.error || 'Image generation failed',
                };
            }
            response = prediction.output;
        }
        // Handle various response formats
        if (!response) {
            return {
                error: 'No output received from Replicate',
            };
        }
        let url;
        if (Array.isArray(response) && response.length > 0) {
            url = response[0];
        }
        else if (typeof response === 'string') {
            url = response;
        }
        if (!url) {
            return {
                error: `No image URL found in response: ${JSON.stringify(response)}`,
            };
        }
        if (!cached && (0, cache_1.isCacheEnabled)()) {
            try {
                await cache.set(cacheKey, JSON.stringify(response));
            }
            catch (err) {
                logger_1.default.error(`Failed to cache response: ${String(err)}`);
            }
        }
        const sanitizedPrompt = prompt
            .replace(/\r?\n|\r/g, ' ')
            .replace(/\[/g, '(')
            .replace(/\]/g, ')');
        const ellipsizedPrompt = (0, text_1.ellipsize)(sanitizedPrompt, 50);
        return {
            output: `![${ellipsizedPrompt}](${url})`,
            cached,
        };
    }
}
exports.ReplicateImageProvider = ReplicateImageProvider;
//# sourceMappingURL=replicate.js.map