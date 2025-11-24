"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperbolicAudioProvider = void 0;
exports.createHyperbolicAudioProvider = createHyperbolicAudioProvider;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const shared_1 = require("../shared");
const HYPERBOLIC_AUDIO_MODELS = [
    {
        id: 'Melo-TTS',
        aliases: ['melo-tts', 'melo'],
        cost: 0.001, // $0.001 per 1000 characters
    },
];
class HyperbolicAudioProvider {
    constructor(modelName, options = {}) {
        this.modelName = modelName || 'Melo-TTS';
        this.config = options.config || {};
        this.env = options.env;
    }
    getApiKey() {
        if (this.config?.apiKey) {
            return this.config.apiKey;
        }
        return this.env?.HYPERBOLIC_API_KEY || (0, envars_1.getEnvString)('HYPERBOLIC_API_KEY');
    }
    getApiUrl() {
        return this.config?.apiBaseUrl || 'https://api.hyperbolic.xyz/v1';
    }
    id() {
        return `hyperbolic:audio:${this.modelName}`;
    }
    toString() {
        return `[Hyperbolic Audio Provider ${this.modelName}]`;
    }
    getApiModelName() {
        const model = HYPERBOLIC_AUDIO_MODELS.find((m) => m.id === this.modelName || (m.aliases && m.aliases.includes(this.modelName)));
        return model?.id || this.modelName;
    }
    calculateAudioCost(textLength) {
        const model = HYPERBOLIC_AUDIO_MODELS.find((m) => m.id === this.modelName || (m.aliases && m.aliases.includes(this.modelName)));
        const costPer1000Chars = model?.cost || 0.001;
        return (textLength / 1000) * costPer1000Chars;
    }
    async callApi(prompt, context, _callApiOptions) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Hyperbolic API key is not set. Set the HYPERBOLIC_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const endpoint = '/audio/generation';
        const body = {
            text: prompt,
        };
        // Add optional parameters
        if (config.model) {
            body.model = config.model;
        }
        if (config.voice) {
            body.voice = config.voice;
        }
        if (config.speed !== undefined) {
            body.speed = config.speed;
        }
        if (config.language) {
            body.language = config.language;
        }
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        };
        let data, status, statusText, latencyMs;
        let cached = false;
        try {
            ({ data, cached, status, statusText, latencyMs } = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS));
            if (status < 200 || status >= 300) {
                return {
                    error: `API error: ${status} ${statusText}\n${typeof data === 'string' ? data : JSON.stringify(data)}`,
                };
            }
        }
        catch (err) {
            logger_1.default.error(`API call error: ${String(err)}`);
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        if (data.error) {
            return {
                error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
            };
        }
        try {
            if (!data.audio) {
                return {
                    error: 'No audio data returned from API',
                };
            }
            const cost = cached ? 0 : this.calculateAudioCost(prompt.length);
            return {
                output: data.audio,
                cached,
                latencyMs,
                cost,
                ...(data.audio
                    ? {
                        isBase64: true,
                        audio: {
                            data: data.audio,
                            format: 'wav',
                        },
                    }
                    : {}),
            };
        }
        catch (err) {
            return {
                error: `API error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
}
exports.HyperbolicAudioProvider = HyperbolicAudioProvider;
function createHyperbolicAudioProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(2).join(':') || 'Melo-TTS';
    return new HyperbolicAudioProvider(modelName, options);
}
//# sourceMappingURL=audio.js.map