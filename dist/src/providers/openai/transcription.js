"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiTranscriptionProvider = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache_1 = require("../../cache");
const logger_1 = __importDefault(require("../../logger"));
const shared_1 = require("../shared");
const _1 = require("./");
const util_1 = require("./util");
class OpenAiTranscriptionProvider extends _1.OpenAiGenericProvider {
    constructor(modelName, options = {}) {
        if (!OpenAiTranscriptionProvider.OPENAI_TRANSCRIPTION_MODEL_NAMES.includes(modelName)) {
            logger_1.default.debug(`Using unknown transcription model: ${modelName}`);
        }
        super(modelName, options);
        this.config = options.config || {};
    }
    id() {
        return `openai:transcription:${this.modelName}`;
    }
    toString() {
        return `[OpenAI Transcription Provider ${this.modelName}]`;
    }
    calculateTranscriptionCost(durationSeconds) {
        const model = util_1.OPENAI_TRANSCRIPTION_MODELS.find((m) => m.id === this.modelName);
        if (!model || !model.cost) {
            return 0;
        }
        const durationMinutes = durationSeconds / 60;
        return durationMinutes * model.cost.perMinute;
    }
    async callApi(prompt, context, _callApiOptions) {
        if (!this.getApiKey()) {
            throw new Error('OpenAI API key is not set. Set the OPENAI_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        // The prompt should be a file path to an audio file
        const audioFilePath = prompt.trim();
        if (!fs_1.default.existsSync(audioFilePath)) {
            return {
                error: `Audio file not found: ${audioFilePath}`,
            };
        }
        try {
            // Read the audio file and create a File object for native FormData
            const fileBuffer = fs_1.default.readFileSync(audioFilePath);
            const fileName = path_1.default.basename(audioFilePath);
            const file = new File([fileBuffer], fileName);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', this.modelName);
            // Add optional parameters
            if (config.language) {
                formData.append('language', config.language);
            }
            if (config.prompt) {
                formData.append('prompt', config.prompt);
            }
            if (config.temperature !== undefined) {
                formData.append('temperature', config.temperature.toString());
            }
            if (config.timestamp_granularities && config.timestamp_granularities.length > 0) {
                formData.append('timestamp_granularities', JSON.stringify(config.timestamp_granularities));
            }
            // Diarization-specific options (for gpt-4o-transcribe-diarize)
            if (this.modelName.includes('diarize')) {
                formData.append('response_format', 'diarized_json');
                if (config.num_speakers !== undefined) {
                    formData.append('num_speakers', config.num_speakers.toString());
                }
                if (config.speaker_labels && config.speaker_labels.length > 0) {
                    formData.append('speaker_labels', JSON.stringify(config.speaker_labels));
                }
            }
            else {
                // Use json for gpt-4o models (verbose_json not supported), verbose_json for others
                const responseFormat = this.modelName.startsWith('gpt-4o-') ? 'json' : 'verbose_json';
                formData.append('response_format', responseFormat);
            }
            const headers = {
                Authorization: `Bearer ${this.getApiKey()}`,
                ...(this.getOrganization() ? { 'OpenAI-Organization': this.getOrganization() } : {}),
            };
            let data, status, statusText;
            let cached = false;
            try {
                ({ data, cached, status, statusText } = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/audio/transcriptions`, {
                    method: 'POST',
                    headers,
                    body: formData,
                }, shared_1.REQUEST_TIMEOUT_MS, 'json', context?.bustCache ?? context?.debug));
                if (status < 200 || status >= 300) {
                    return {
                        error: `API error: ${status} ${statusText}\n${typeof data === 'string' ? data : JSON.stringify(data)}`,
                    };
                }
            }
            catch (err) {
                logger_1.default.error('API call error', { error: err });
                return {
                    error: `API call error: ${String(err)}`,
                };
            }
            if (data.error) {
                return {
                    error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
                };
            }
            // Calculate cost based on audio duration
            const durationSeconds = data.duration || 0;
            const cost = cached ? 0 : this.calculateTranscriptionCost(durationSeconds);
            // Calculate average quality metrics from segments
            const segments = data.segments || [];
            let avgLogprob;
            let avgCompressionRatio;
            let avgNoSpeechProb;
            if (segments.length > 0) {
                const validSegments = segments.filter((s) => s.avg_logprob !== undefined ||
                    s.compression_ratio !== undefined ||
                    s.no_speech_prob !== undefined);
                if (validSegments.length > 0) {
                    const sumLogprob = validSegments.reduce((sum, s) => sum + (s.avg_logprob || 0), 0);
                    const sumCompressionRatio = validSegments.reduce((sum, s) => sum + (s.compression_ratio || 0), 0);
                    const sumNoSpeechProb = validSegments.reduce((sum, s) => sum + (s.no_speech_prob || 0), 0);
                    avgLogprob = validSegments.some((s) => s.avg_logprob !== undefined)
                        ? sumLogprob / validSegments.length
                        : undefined;
                    avgCompressionRatio = validSegments.some((s) => s.compression_ratio !== undefined)
                        ? sumCompressionRatio / validSegments.length
                        : undefined;
                    avgNoSpeechProb = validSegments.some((s) => s.no_speech_prob !== undefined)
                        ? sumNoSpeechProb / validSegments.length
                        : undefined;
                }
            }
            // Format output based on response format
            let output;
            if (this.modelName.includes('diarize') && data.segments) {
                // Format diarized output with speaker labels
                output = data.segments
                    .map((segment) => {
                    const speaker = segment.speaker || 'Unknown';
                    const text = segment.text || '';
                    const start = segment.start?.toFixed(2) || '0.00';
                    const end = segment.end?.toFixed(2) || '0.00';
                    return `[${start}s - ${end}s] ${speaker}: ${text}`;
                })
                    .join('\n');
            }
            else if (data.text) {
                // Standard transcription
                output = data.text;
            }
            else {
                return {
                    error: 'No transcription returned from API',
                };
            }
            return {
                output,
                cached,
                cost,
                metadata: {
                    task: data.task,
                    duration: durationSeconds,
                    language: data.language,
                    segments: data.segments?.length || 0,
                    ...(avgLogprob !== undefined ? { avgLogprob } : {}),
                    ...(avgCompressionRatio !== undefined ? { avgCompressionRatio } : {}),
                    ...(avgNoSpeechProb !== undefined ? { avgNoSpeechProb } : {}),
                    ...(this.modelName.includes('diarize') && data.speakers
                        ? { speakers: data.speakers }
                        : {}),
                },
            };
        }
        catch (err) {
            logger_1.default.error('Transcription error', { error: err });
            return {
                error: `Transcription error: ${String(err)}`,
            };
        }
    }
}
exports.OpenAiTranscriptionProvider = OpenAiTranscriptionProvider;
OpenAiTranscriptionProvider.OPENAI_TRANSCRIPTION_MODEL_NAMES = util_1.OPENAI_TRANSCRIPTION_MODELS.map((model) => model.id);
//# sourceMappingURL=transcription.js.map