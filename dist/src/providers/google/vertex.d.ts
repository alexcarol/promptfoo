import type { ApiEmbeddingProvider, ApiProvider, CallApiContextParams, ProviderEmbeddingResponse, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { CompletionOptions } from './types';
declare class VertexGenericProvider implements ApiProvider {
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
    getApiHost(): string | undefined;
    getProjectId(): Promise<string>;
    getApiKey(): string | undefined;
    getRegion(): string;
    getPublisher(): string | undefined;
    getApiVersion(): string;
    /**
     * Helper method to get Google client with credentials support
     */
    getClientWithCredentials(): Promise<import("google-auth-library").AuthClient>;
    callApi(_prompt: string): Promise<ProviderResponse>;
}
export declare class VertexChatProvider extends VertexGenericProvider {
    private mcpClient;
    private initializationPromise;
    private loadedFunctionCallbacks;
    constructor(modelName: string, options?: {
        config?: CompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    private initializeMCP;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    callClaudeApi(prompt: string, _context?: CallApiContextParams): Promise<ProviderResponse>;
    callGeminiApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    callPalm2Api(prompt: string): Promise<ProviderResponse>;
    callLlamaApi(prompt: string, _context?: CallApiContextParams): Promise<ProviderResponse>;
    cleanup(): Promise<void>;
    /**
     * Loads a function from an external file
     * @param fileRef The file reference in the format 'file://path/to/file:functionName'
     * @returns The loaded function
     */
    private loadExternalFunction;
    /**
     * Executes a function callback with proper error handling
     */
    private executeFunctionCallback;
}
export declare class VertexEmbeddingProvider implements ApiEmbeddingProvider {
    modelName: string;
    config: any;
    env?: any;
    constructor(modelName: string, config?: any, env?: any);
    /**
     * Helper method to get Google client with credentials support
     */
    getClientWithCredentials(): Promise<import("google-auth-library").AuthClient>;
    id(): string;
    getRegion(): string;
    getApiVersion(): string;
    getProjectId(): Promise<string>;
    callApi(): Promise<ProviderResponse>;
    callEmbeddingApi(input: string): Promise<ProviderEmbeddingResponse>;
}
export declare const DefaultGradingProvider: VertexChatProvider;
export declare const DefaultEmbeddingProvider: VertexEmbeddingProvider;
export {};
//# sourceMappingURL=vertex.d.ts.map