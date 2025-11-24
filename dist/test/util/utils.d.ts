import type { ApiProvider, ProviderResponse } from '../../src/types/index';
export declare class TestGrader implements ApiProvider {
    callApi(): Promise<ProviderResponse>;
    id(): string;
}
export declare function createMockResponse(options?: {
    ok?: boolean;
    body?: any;
    statusText?: string;
    status?: number;
    headers?: Headers;
    text?: () => Promise<string>;
    json?: () => Promise<any>;
}): Response;
export declare function stripAnsi(value: string): string;
//# sourceMappingURL=utils.d.ts.map