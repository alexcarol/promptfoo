import { AzureGenericProvider } from './generic';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
export declare class AzureChatCompletionProvider extends AzureGenericProvider {
    private mcpClient;
    private functionCallbackHandler;
    constructor(...args: ConstructorParameters<typeof AzureGenericProvider>);
    private initializeMCP;
    cleanup(): Promise<void>;
    /**
     * Check if the current deployment is configured as a reasoning model
     */
    protected isReasoningModel(): boolean;
    getOpenAiBody(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Record<string, any>;
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=chat.d.ts.map