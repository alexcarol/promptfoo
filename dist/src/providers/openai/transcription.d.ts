import { OpenAiGenericProvider } from './';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
export interface OpenAiTranscriptionOptions {
    apiKey?: string;
    apiKeyEnvar?: string;
    apiBaseUrl?: string;
    organization?: string;
    language?: string;
    prompt?: string;
    temperature?: number;
    timestamp_granularities?: ('word' | 'segment')[];
    num_speakers?: number;
    speaker_labels?: string[];
}
export declare class OpenAiTranscriptionProvider extends OpenAiGenericProvider {
    static OPENAI_TRANSCRIPTION_MODEL_NAMES: string[];
    config: OpenAiTranscriptionOptions;
    constructor(modelName: string, options?: {
        config?: OpenAiTranscriptionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    private calculateTranscriptionCost;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=transcription.d.ts.map