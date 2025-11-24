import type { ApiProvider } from '../types/providers';
export interface ProviderTestResult {
    success: boolean;
    message: string;
    error?: string;
    providerResponse?: any;
    transformedRequest?: any;
    sessionId?: string;
    analysis?: {
        changes_needed?: boolean;
        changes_needed_reason?: string;
        changes_needed_suggestions?: string[];
    };
}
export interface SessionTestResult {
    success: boolean;
    message: string;
    reason?: string;
    error?: string;
    details?: {
        sessionId?: string;
        sessionSource?: string;
        request1?: {
            prompt: string;
            sessionId?: string;
        };
        response1?: any;
        request2?: {
            prompt: string;
            sessionId?: string;
        };
        response2?: any;
    };
}
/**
 * Tests basic provider connectivity with a prompt.
 * Extracted from POST /providers/test endpoint
 * @param provider The provider to test
 * @param prompt An optional prompt to test w/
 */
export declare function testProviderConnectivity(provider: ApiProvider, prompt?: string): Promise<ProviderTestResult>;
/**
 * Tests multi-turn session functionality by making two sequential requests
 * For server-sourced sessions, extracts sessionId from first response and uses it in second request
 * For client-sourced sessions, generates a sessionId and uses it in both requests
 */
export declare function testProviderSession(provider: ApiProvider, sessionConfig?: {
    sessionSource?: string;
    sessionParser?: string;
}, options?: {
    skipConfigValidation?: boolean;
}): Promise<SessionTestResult>;
//# sourceMappingURL=testProvider.d.ts.map