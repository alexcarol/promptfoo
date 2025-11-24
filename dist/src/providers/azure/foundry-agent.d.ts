import { AzureGenericProvider } from './generic';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { AzureAssistantOptions, AzureAssistantProviderOptions } from './types';
export declare class AzureFoundryAgentProvider extends AzureGenericProvider {
    assistantConfig: AzureAssistantOptions;
    private loadedFunctionCallbacks;
    private projectClient;
    private projectUrl;
    constructor(deploymentName: string, options?: AzureAssistantProviderOptions);
    /**
     * Initialize the Azure AI Project client
     */
    private initializeClient;
    /**
     * Preloads all function callbacks to ensure they're ready when needed
     */
    private preloadFunctionCallbacks;
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
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
    /**
     * Format error responses consistently
     */
    private formatError;
    /**
     * Helper methods to check for specific error types
     */
    private isContentFilterError;
    private isRateLimitError;
    private isServiceError;
    private isServerError;
    private isRetryableError;
    /**
     * Poll a run until it completes or fails
     */
    private pollRun;
    /**
     * Handle tool calls during run polling
     */
    private pollRunWithToolCallHandling;
    /**
     * Process a completed run to extract messages
     */
    private processCompletedRun;
}
//# sourceMappingURL=foundry-agent.d.ts.map