import { type ApiProvider, type CallApiContextParams, type CallApiOptionsParams, type EvaluateResult, type GuardrailResponse, type RedteamFileConfig, type TokenUsage } from '../../types/index';
import type { TraceContextData } from '../../tracing/traceContext';
declare class RedteamProviderManager {
    private provider;
    private jsonOnlyProvider;
    private multilingualProvider;
    private gradingProvider;
    private gradingJsonOnlyProvider;
    clearProvider(): void;
    setProvider(provider: RedteamFileConfig['provider']): Promise<void>;
    setMultilingualProvider(provider: RedteamFileConfig['provider']): Promise<void>;
    setGradingProvider(provider: RedteamFileConfig['provider']): Promise<void>;
    getProvider({ provider, jsonOnly, preferSmallModel, }: {
        provider?: RedteamFileConfig['provider'];
        jsonOnly?: boolean;
        preferSmallModel?: boolean;
    }): Promise<ApiProvider>;
    getGradingProvider({ provider, jsonOnly, }?: {
        provider?: RedteamFileConfig['provider'];
        jsonOnly?: boolean;
    }): Promise<ApiProvider>;
    getMultilingualProvider(): Promise<ApiProvider | undefined>;
}
export declare const redteamProviderManager: RedteamProviderManager;
export type TargetResponse = {
    output: string;
    error?: string;
    sessionId?: string;
    tokenUsage?: TokenUsage;
    guardrails?: GuardrailResponse;
    traceContext?: TraceContextData | null;
    traceSummary?: string;
};
/**
 * Gets the response from the target provider for a given prompt.
 * @param targetProvider - The API provider to get the response from.
 * @param targetPrompt - The prompt to send to the target provider.
 * @returns A promise that resolves to the target provider's response as an object.
 */
export declare function getTargetResponse(targetProvider: ApiProvider, targetPrompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<TargetResponse>;
export interface Message {
    role: 'user' | 'assistant' | 'system' | 'developer';
    content: string;
}
/**
 * Validates if a parsed JSON object is a valid chat message array
 */
export declare function isValidChatMessageArray(parsed: unknown): parsed is Message[];
export declare const getLastMessageContent: (messages: Message[], role: Message["role"]) => string | undefined;
/**
 * Converts an array of messages to the redteamHistory format
 * @param messages Array of messages with role and content
 * @returns Array of prompt-output pairs, or empty array if conversion fails
 */
export declare const messagesToRedteamHistory: (messages: Message[]) => {
    prompt: string;
    output: string;
}[];
export declare function checkPenalizedPhrases(output: string): boolean;
/**
 * Creates an iteration-specific context with transformed variables for redteam iterations.
 * This utility function handles the common pattern of re-running transformVars for each
 * iteration to generate fresh values (e.g., new sessionId).
 *
 * @param originalVars - The original variables before transformation
 * @param transformVarsConfig - The transform configuration from the test
 * @param context - The original context that may be updated
 * @param iterationNumber - The current iteration number (for logging)
 * @param loggerTag - The logger tag to use for debug messages (e.g., '[Iterative]', '[IterativeTree]')
 * @returns An object containing the transformed vars and iteration-specific context
 */
export declare function createIterationContext({ originalVars, transformVarsConfig, context, iterationNumber, loggerTag, }: {
    originalVars: Record<string, string | object>;
    transformVarsConfig?: string;
    context?: CallApiContextParams;
    iterationNumber: number;
    loggerTag?: string;
}): Promise<CallApiContextParams | undefined>;
/**
 * Base metadata interface shared by all redteam providers
 */
export interface BaseRedteamMetadata {
    redteamFinalPrompt?: string;
    messages: Record<string, any>[];
    stopReason: string;
    redteamHistory?: {
        prompt: string;
        output: string;
    }[];
}
/**
 * Base response interface shared by all redteam providers
 */
export interface BaseRedteamResponse {
    output: string;
    metadata: BaseRedteamMetadata;
    tokenUsage: TokenUsage;
    guardrails?: GuardrailResponse;
    additionalResults?: EvaluateResult[];
}
/**
 * Shared unblocking functionality used by redteam providers to handle blocking questions
 */
export declare function tryUnblocking({ messages, lastResponse, goal, purpose, }: {
    messages: Message[];
    lastResponse: string;
    goal: string | undefined;
    purpose?: string;
}): Promise<{
    success: boolean;
    unblockingPrompt?: string;
}>;
export {};
//# sourceMappingURL=shared.d.ts.map