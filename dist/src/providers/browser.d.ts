import type { ApiProvider, CallApiContextParams, ProviderOptions, ProviderResponse } from '../types/index';
interface BrowserAction {
    action: string;
    args?: Record<string, any>;
    name?: string;
}
interface BrowserProviderConfig {
    cookies?: Array<{
        domain?: string;
        name: string;
        path?: string;
        value: string;
    }> | string;
    headless?: boolean;
    steps: BrowserAction[];
    timeoutMs?: number;
    transformResponse?: string | Function;
    /**
     * @deprecated
     */
    responseParser?: string | Function;
    connectOptions?: {
        mode?: 'cdp' | 'websocket';
        debuggingPort?: number;
        wsEndpoint?: string;
    };
}
export declare function createTransformResponse(parser: any): (extracted: Record<string, any>, finalHtml: string) => ProviderResponse;
export declare class BrowserProvider implements ApiProvider {
    config: BrowserProviderConfig;
    transformResponse: (extracted: Record<string, any>, finalHtml: string) => ProviderResponse;
    private defaultTimeout;
    private headless;
    constructor(_: string, options: ProviderOptions);
    id(): string;
    toString(): string;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    private setCookies;
    private connectToExistingBrowser;
    private executeAction;
    private waitForSelector;
    private waitForNewChildren;
    private renderArgs;
}
export {};
//# sourceMappingURL=browser.d.ts.map