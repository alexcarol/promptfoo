import type { FetchWithCacheResult } from '../cache';
import type { CallApiContextParams, ProviderResponse } from '../types/index';
export interface TransformResponseContext {
    response: FetchWithCacheResult<any>;
}
export declare function createTransformResponse(parser: string | Function | undefined): Promise<(data: any, text: string, context?: TransformResponseContext) => ProviderResponse>;
export declare function createTransformRequest(transform: string | Function | undefined): Promise<(prompt: string, vars: Record<string, any>, context?: CallApiContextParams) => any>;
//# sourceMappingURL=httpTransforms.d.ts.map