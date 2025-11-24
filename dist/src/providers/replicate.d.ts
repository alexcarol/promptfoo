import type { ApiModerationProvider, ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderModerationResponse, ProviderResponse } from '../types/index';
import type { EnvOverrides } from '../types/env';
interface ReplicateCompletionOptions {
    apiKey?: string;
    temperature?: number;
    max_length?: number;
    max_new_tokens?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    system_prompt?: string;
    stop_sequences?: string;
    seed?: number;
    prompt?: {
        prefix?: string;
        suffix?: string;
    };
    [key: string]: any;
}
interface ReplicatePrediction {
    id: string;
    model: string;
    version: string;
    input: Record<string, any>;
    output?: any;
    logs?: string;
    error?: string | null;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    created_at: string;
    started_at?: string;
    completed_at?: string;
    urls: {
        get: string;
        cancel: string;
    };
}
export declare class ReplicateProvider implements ApiProvider {
    modelName: string;
    apiKey?: string;
    config: ReplicateCompletionOptions;
    constructor(modelName: string, options?: {
        config?: ReplicateCompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    callApi(prompt: string): Promise<ProviderResponse>;
    protected pollForCompletion(predictionId: string): Promise<ReplicatePrediction>;
}
export declare const LLAMAGUARD_DESCRIPTIONS: Record<string, string>;
export declare class ReplicateModerationProvider extends ReplicateProvider implements ApiModerationProvider {
    callModerationApi(prompt: string, assistant: string): Promise<ProviderModerationResponse>;
}
export declare const LLAMAGUARD_4_MODEL_ID = "meta/llama-guard-4-12b";
export declare const LLAMAGUARD_3_MODEL_ID = "meta/llama-guard-3-8b:146d1220d447cdcc639bc17c5f6137416042abee6ae153a2615e6ef5749205c8";
export declare const DefaultModerationProvider: ReplicateModerationProvider;
export declare class ReplicateImageProvider extends ReplicateProvider {
    constructor(modelName: string, options?: {
        config?: ReplicateCompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=replicate.d.ts.map