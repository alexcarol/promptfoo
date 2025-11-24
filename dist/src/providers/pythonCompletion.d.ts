import type { ApiProvider, CallApiContextParams, ProviderClassificationResponse, ProviderEmbeddingResponse, ProviderOptions, ProviderResponse } from '../types/index';
interface PythonProviderConfig {
    pythonExecutable?: string;
    workers?: number;
    timeout?: number;
    [key: string]: any;
}
export declare class PythonProvider implements ApiProvider {
    private options?;
    config: PythonProviderConfig;
    private scriptPath;
    private functionName;
    private isInitialized;
    private initializationPromise;
    label: string | undefined;
    private pool;
    constructor(runPath: string, options?: ProviderOptions | undefined);
    id(): string;
    /**
     * Process any file:// references in the configuration and initialize worker pool
     * This should be called after initialization
     * @returns A promise that resolves when all file references have been processed
     */
    initialize(): Promise<void>;
    /**
     * Determine worker count based on config and environment
     * Priority: config.workers > PROMPTFOO_PYTHON_WORKERS env > default 1
     */
    private getWorkerCount;
    /**
     * Execute the Python script with the specified API type
     * Handles caching, file reference processing, and executing the Python script
     *
     * @param prompt - The prompt to pass to the Python script
     * @param context - Optional context information
     * @param apiType - The type of API to call (call_api, call_embedding_api, call_classification_api)
     * @returns The response from the Python script
     */
    private executePythonScript;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    callEmbeddingApi(prompt: string): Promise<ProviderEmbeddingResponse>;
    callClassificationApi(prompt: string): Promise<ProviderClassificationResponse>;
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=pythonCompletion.d.ts.map