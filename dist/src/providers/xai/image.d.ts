import { OpenAiImageProvider } from '../openai/image';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider } from '../../types/providers';
import type { OpenAiSharedOptions } from '../openai/types';
type XaiImageOptions = OpenAiSharedOptions & {
    n?: number;
    response_format?: 'url' | 'b64_json';
    user?: string;
};
export declare class XAIImageProvider extends OpenAiImageProvider {
    config: XaiImageOptions;
    constructor(modelName: string, options?: {
        config?: XaiImageOptions;
        id?: string;
        env?: EnvOverrides;
    });
    getApiKey(): string | undefined;
    getApiUrlDefault(): string;
    id(): string;
    toString(): string;
    private getApiModelName;
    private calculateImageCost;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare function createXAIImageProvider(providerPath: string, options?: {
    config?: XaiImageOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
export {};
//# sourceMappingURL=image.d.ts.map