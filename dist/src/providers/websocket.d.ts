import type { ApiProvider, CallApiContextParams, ProviderOptions, ProviderResponse } from '../types/index';
export declare const processResult: (transformedResponse: any) => ProviderResponse;
interface WebSocketProviderConfig {
    messageTemplate: string;
    url?: string;
    timeoutMs?: number;
    transformResponse?: string | Function;
    streamResponse?: (accumulator: ProviderResponse, data: any, context: CallApiContextParams | undefined) => [ProviderResponse, boolean];
    headers?: Record<string, string>;
    /**
     * @deprecated
     */
    responseParser?: string | Function;
}
export declare function createTransformResponse(parser: any): (data: any) => ProviderResponse;
export declare function createStreamResponse(transform: string | Function | undefined): Promise<(accumulator: ProviderResponse, data: any, context: CallApiContextParams | undefined) => [ProviderResponse, boolean]>;
export declare class WebSocketProvider implements ApiProvider {
    url: string;
    config: WebSocketProviderConfig;
    timeoutMs: number;
    transformResponse: (data: any) => ProviderResponse;
    streamResponse?: Promise<(accumulator: ProviderResponse, data: any, context: CallApiContextParams | undefined) => [ProviderResponse, boolean]>;
    constructor(url: string, options: ProviderOptions);
    id(): string;
    toString(): string;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=websocket.d.ts.map