import { OpenAiGenericProvider } from '.';
import type { ProviderEmbeddingResponse } from '../../types/index';
export declare class OpenAiEmbeddingProvider extends OpenAiGenericProvider {
    callEmbeddingApi(text: string): Promise<ProviderEmbeddingResponse>;
}
//# sourceMappingURL=embedding.d.ts.map