import type { ApiProvider, CallApiContextParams, ProviderClassificationResponse, ProviderEmbeddingResponse, ProviderOptions, ProviderResponse } from '../types/index';
interface RubyProviderConfig {
    rubyExecutable?: string;
}
/**
 * Ruby provider for executing custom Ruby scripts as API providers.
 * Supports text generation, embeddings, and classification tasks.
 */
export declare class RubyProvider implements ApiProvider {
    private options?;
    config: RubyProviderConfig;
    private scriptPath;
    private functionName;
    private isInitialized;
    private initializationPromise;
    id: () => string;
    label: string | undefined;
    /**
     * Creates a new Ruby provider instance.
     * @param runPath - Path to the Ruby script, optionally with function name (e.g., "script.rb:function_name")
     * @param options - Provider configuration options
     */
    constructor(runPath: string, options?: ProviderOptions | undefined);
    /**
     * Process any file:// references in the configuration
     * This should be called after initialization
     * @returns A promise that resolves when all file references have been processed
     */
    initialize(): Promise<void>;
    /**
     * Execute the Ruby script with the specified API type
     * Handles caching, file reference processing, and executing the Ruby script
     *
     * @param prompt - The prompt to pass to the Ruby script
     * @param context - Optional context information
     * @param apiType - The type of API to call (call_api, call_embedding_api, call_classification_api)
     * @returns The response from the Ruby script
     */
    private executeRubyScript;
    /**
     * Calls the Ruby script for text generation.
     * @param prompt - The input prompt to send to the Ruby script
     * @param context - Optional context with variables and metadata
     * @returns Provider response with output, token usage, and other metadata
     */
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    /**
     * Calls the Ruby script for embedding generation.
     * @param prompt - The input text to generate embeddings for
     * @returns Provider response with embedding array
     */
    callEmbeddingApi(prompt: string): Promise<ProviderEmbeddingResponse>;
    /**
     * Calls the Ruby script for classification tasks.
     * @param prompt - The input text to classify
     * @returns Provider response with classification results
     */
    callClassificationApi(prompt: string): Promise<ProviderClassificationResponse>;
}
export {};
//# sourceMappingURL=rubyCompletion.d.ts.map