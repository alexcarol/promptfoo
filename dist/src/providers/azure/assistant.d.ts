import { AzureGenericProvider } from './generic';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { AzureAssistantOptions, AzureAssistantProviderOptions } from './types';
export declare class AzureAssistantProvider extends AzureGenericProvider {
    assistantConfig: AzureAssistantOptions;
    private functionCallbackHandler;
    constructor(deploymentName: string, options?: AzureAssistantProviderOptions);
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
    /**
     * Format error responses consistently
     */
    private formatError;
    /**
     * Helper method to make HTTP requests using fetchWithCache
     */
    private makeRequest;
    /**
     * Get headers for API requests
     */
    private getHeaders;
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
     * Process a completed run to extract messages and tool calls
     */
    private processCompletedRun;
}
//# sourceMappingURL=assistant.d.ts.map