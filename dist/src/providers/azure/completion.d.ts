import { AzureGenericProvider } from './generic';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
export declare class AzureCompletionProvider extends AzureGenericProvider {
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=completion.d.ts.map