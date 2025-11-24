import { AzureGenericProvider } from './generic';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
export declare class AzureResponsesProvider extends AzureGenericProvider {
    private functionCallbackHandler;
    private processor;
    constructor(...args: ConstructorParameters<typeof AzureGenericProvider>);
    private initializeMCP;
    isReasoningModel(): boolean;
    supportsTemperature(): boolean;
    getAzureResponsesBody(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Record<string, any>;
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=responses.d.ts.map