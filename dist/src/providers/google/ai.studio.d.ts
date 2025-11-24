import type { ApiProvider, CallApiContextParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { CompletionOptions } from './types';
declare class AIStudioGenericProvider implements ApiProvider {
    modelName: string;
    config: CompletionOptions;
    env?: EnvOverrides;
    constructor(modelName: string, options?: {
        config?: CompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    getApiUrlDefault(): string;
    getApiHost(): string | undefined;
    getApiUrl(): string;
    getApiKey(): string | undefined;
    callApi(_prompt: string): Promise<ProviderResponse>;
}
export declare class AIStudioChatProvider extends AIStudioGenericProvider {
    private mcpClient;
    private initializationPromise;
    constructor(modelName: string, options?: {
        config?: CompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    private initializeMCP;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    callGemini(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    cleanup(): Promise<void>;
}
export declare const DefaultGradingProvider: AIStudioGenericProvider;
export declare const DefaultGradingJsonProvider: AIStudioGenericProvider;
export declare const DefaultLlmRubricProvider: AIStudioGenericProvider;
export declare const DefaultSuggestionsProvider: AIStudioGenericProvider;
export declare const DefaultSynthesizeProvider: AIStudioGenericProvider;
export {};
//# sourceMappingURL=ai.studio.d.ts.map