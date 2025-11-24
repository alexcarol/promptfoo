"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiImageProvider = exports.GPT_IMAGE1_COSTS = exports.DALLE3_COSTS = exports.DALLE2_COSTS = void 0;
exports.validateSizeForModel = validateSizeForModel;
exports.formatOutput = formatOutput;
exports.prepareRequestBody = prepareRequestBody;
exports.calculateImageCost = calculateImageCost;
exports.callOpenAiImageApi = callOpenAiImageApi;
exports.processApiResponse = processApiResponse;
const cache_1 = require("../../cache");
const logger_1 = __importDefault(require("../../logger"));
const text_1 = require("../../util/text");
const shared_1 = require("../shared");
const _1 = require(".");
const util_1 = require("./util");
const DALLE2_VALID_SIZES = ['256x256', '512x512', '1024x1024'];
const DALLE3_VALID_SIZES = ['1024x1024', '1792x1024', '1024x1792'];
const GPT_IMAGE1_VALID_SIZES = ['1024x1024', '1024x1536', '1536x1024'];
const DEFAULT_SIZE = '1024x1024';
exports.DALLE2_COSTS = {
    '256x256': 0.016,
    '512x512': 0.018,
    '1024x1024': 0.02,
};
exports.DALLE3_COSTS = {
    standard_1024x1024: 0.04,
    standard_1024x1792: 0.08,
    standard_1792x1024: 0.08,
    hd_1024x1024: 0.08,
    hd_1024x1792: 0.12,
    hd_1792x1024: 0.12,
};
exports.GPT_IMAGE1_COSTS = {
    low_1024x1024: 0.011,
    low_1024x1536: 0.016,
    low_1536x1024: 0.016,
    medium_1024x1024: 0.042,
    medium_1024x1536: 0.063,
    medium_1536x1024: 0.063,
    high_1024x1024: 0.167,
    high_1024x1536: 0.25,
    high_1536x1024: 0.25,
};
function validateSizeForModel(size, model) {
    if (model === 'dall-e-3' && !DALLE3_VALID_SIZES.includes(size)) {
        return {
            valid: false,
            message: `Invalid size "${size}" for DALL-E 3. Valid sizes are: ${DALLE3_VALID_SIZES.join(', ')}`,
        };
    }
    if (model === 'dall-e-2' && !DALLE2_VALID_SIZES.includes(size)) {
        return {
            valid: false,
            message: `Invalid size "${size}" for DALL-E 2. Valid sizes are: ${DALLE2_VALID_SIZES.join(', ')}`,
        };
    }
    if (model === 'gpt-image-1' && !GPT_IMAGE1_VALID_SIZES.includes(size)) {
        return {
            valid: false,
            message: `Invalid size "${size}" for GPT Image 1. Valid sizes are: ${GPT_IMAGE1_VALID_SIZES.join(', ')}`,
        };
    }
    return { valid: true };
}
function formatOutput(data, prompt, responseFormat) {
    if (responseFormat === 'b64_json') {
        const b64Json = data.data[0].b64_json;
        if (!b64Json) {
            return { error: `No base64 image data found in response: ${JSON.stringify(data)}` };
        }
        return JSON.stringify(data);
    }
    else {
        const url = data.data[0].url;
        if (!url) {
            return { error: `No image URL found in response: ${JSON.stringify(data)}` };
        }
        const sanitizedPrompt = prompt
            .replace(/\r?\n|\r/g, ' ')
            .replace(/\[/g, '(')
            .replace(/\]/g, ')');
        const ellipsizedPrompt = (0, text_1.ellipsize)(sanitizedPrompt, 50);
        return `![${ellipsizedPrompt}](${url})`;
    }
}
function prepareRequestBody(model, prompt, size, responseFormat, config) {
    const body = {
        model,
        prompt,
        n: config.n || 1,
        size,
        response_format: responseFormat,
    };
    if (model === 'dall-e-3') {
        if ('quality' in config && config.quality) {
            body.quality = config.quality;
        }
        if ('style' in config && config.style) {
            body.style = config.style;
        }
    }
    if (model === 'gpt-image-1') {
        if ('quality' in config && config.quality) {
            body.quality = config.quality;
        }
    }
    return body;
}
function calculateImageCost(model, size, quality, n = 1) {
    const imageQuality = quality || 'standard';
    if (model === 'dall-e-3') {
        const costKey = `${imageQuality}_${size}`;
        const costPerImage = exports.DALLE3_COSTS[costKey] || exports.DALLE3_COSTS['standard_1024x1024'];
        return costPerImage * n;
    }
    else if (model === 'dall-e-2') {
        const costPerImage = exports.DALLE2_COSTS[size] || exports.DALLE2_COSTS['1024x1024'];
        return costPerImage * n;
    }
    else if (model === 'gpt-image-1') {
        const q = quality || 'low';
        const costKey = `${q}_${size}`;
        const costPerImage = exports.GPT_IMAGE1_COSTS[costKey] || exports.GPT_IMAGE1_COSTS['low_1024x1024'];
        return costPerImage * n;
    }
    return 0.04 * n;
}
async function callOpenAiImageApi(url, body, headers, timeout) {
    return await (0, cache_1.fetchWithCache)(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }, timeout);
}
async function processApiResponse(data, prompt, responseFormat, cached, model, size, latencyMs, quality, n = 1) {
    if (data.error) {
        await data?.deleteFromCache?.();
        return {
            error: (0, util_1.formatOpenAiError)(data),
        };
    }
    try {
        const formattedOutput = formatOutput(data, prompt, responseFormat);
        if (typeof formattedOutput === 'object') {
            return formattedOutput;
        }
        const cost = cached ? 0 : calculateImageCost(model, size, quality, n);
        return {
            output: formattedOutput,
            cached,
            latencyMs,
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
class OpenAiImageProvider extends _1.OpenAiGenericProvider {
    constructor(modelName, options = {}) {
        super(modelName, options);
        this.config = options.config || {};
    }
    async callApi(prompt, context, _callApiOptions) {
        if (this.requiresApiKey() && !this.getApiKey()) {
            throw new Error('OpenAI API key is not set. Set the OPENAI_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const model = config.model || this.modelName;
        const operation = ('operation' in config && config.operation) || 'generation';
        const responseFormat = config.response_format || 'url';
        if (operation !== 'generation') {
            return {
                error: `Only 'generation' operations are currently supported. '${operation}' operations are not implemented.`,
            };
        }
        const endpoint = '/images/generations';
        const size = config.size || DEFAULT_SIZE;
        const sizeValidation = validateSizeForModel(size, model);
        if (!sizeValidation.valid) {
            return { error: sizeValidation.message };
        }
        const body = prepareRequestBody(model, prompt, size, responseFormat, config);
        const headers = {
            'Content-Type': 'application/json',
            ...(this.getApiKey() ? { Authorization: `Bearer ${this.getApiKey()}` } : {}),
            ...(this.getOrganization() ? { 'OpenAI-Organization': this.getOrganization() } : {}),
            ...config.headers,
        };
        let data, status, statusText;
        let cached = false;
        let latencyMs;
        try {
            ({ data, cached, status, statusText, latencyMs } = await callOpenAiImageApi(`${this.getApiUrl()}${endpoint}`, body, headers, shared_1.REQUEST_TIMEOUT_MS));
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
        return processApiResponse(data, prompt, responseFormat, cached, model, size, latencyMs, config.quality, config.n || 1);
    }
}
exports.OpenAiImageProvider = OpenAiImageProvider;
//# sourceMappingURL=image.js.map