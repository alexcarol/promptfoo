import type { CallApiContextParams, CallApiOptionsParams, EnvOverrides, ProviderEmbeddingResponse, ProviderOptions, ProviderResponse } from '../types/index';
import { OpenAiChatCompletionProvider } from './openai/chat';
import { OpenAiCompletionProvider } from './openai/completion';
import { OpenAiEmbeddingProvider } from './openai/embedding';
type Model = {
    id: string;
    object: string;
    created: number;
    owned_by: string;
};
export declare function fetchLocalModels(apiBaseUrl: string): Promise<Model[]>;
export declare function hasLocalModel(modelId: string, apiBaseUrl: string): Promise<boolean>;
export declare function parseProviderPath(providerPath: string): {
    type: 'chat' | 'completion' | 'embeddings';
    model: string;
};
/**
 * Factory for creating Docker Model Runner providers using OpenAI-compatible endpoints.
 */
export declare function createDockerProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): DMRChatCompletionProvider | DMRCompletionProvider | DMREmbeddingProvider;
export declare class DMRChatCompletionProvider extends OpenAiChatCompletionProvider {
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare class DMRCompletionProvider extends OpenAiCompletionProvider {
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare class DMREmbeddingProvider extends OpenAiEmbeddingProvider {
    callEmbeddingApi(text: string): Promise<ProviderEmbeddingResponse>;
}
export {};
//# sourceMappingURL=docker.d.ts.map