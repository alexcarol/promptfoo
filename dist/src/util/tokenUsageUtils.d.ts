import type { CompletionTokenDetails, TokenUsage } from '../types/shared';
/**
 * Helper to create empty completion details
 */
export declare function createEmptyCompletionDetails(): Required<CompletionTokenDetails>;
/**
 * Create an empty assertions token usage object.
 */
export declare function createEmptyAssertions(): NonNullable<TokenUsage['assertions']>;
/**
 * Create an empty token usage object with all fields initialized to zero.
 */
export declare function createEmptyTokenUsage(): Required<TokenUsage>;
/**
 * Accumulate token usage into a target object. Mutates {@code target}.
 * @param target Object to update
 * @param update Usage to add
 * @param incrementRequests Whether to increment numRequests when update is provided but doesn't specify numRequests
 */
export declare function accumulateTokenUsage(target: TokenUsage, update: Partial<TokenUsage> | undefined, incrementRequests?: boolean): void;
/**
 * Accumulate token usage specifically for assertions.
 * This function operates directly on an assertions object rather than a full TokenUsage object.
 * @param target Assertions object to update
 * @param update Partial token usage that may contain assertion-related fields
 */
export declare function accumulateAssertionTokenUsage(target: NonNullable<TokenUsage['assertions']>, update: Partial<TokenUsage> | undefined): void;
/**
 * Accumulate token usage from a response, handling the common pattern of
 * incrementing numRequests when no token usage is provided.
 * @param target Object to update
 * @param response Response that may contain token usage
 */
export declare function accumulateResponseTokenUsage(target: TokenUsage, response: {
    tokenUsage?: Partial<TokenUsage>;
} | undefined): void;
//# sourceMappingURL=tokenUsageUtils.d.ts.map