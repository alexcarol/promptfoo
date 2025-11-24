import { AzureGenericProvider } from './generic';
import type { ProviderEmbeddingResponse } from '../../types/index';
export declare class AzureEmbeddingProvider extends AzureGenericProvider {
    callEmbeddingApi(text: string): Promise<ProviderEmbeddingResponse>;
}
//# sourceMappingURL=embedding.d.ts.map