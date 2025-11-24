import type { GradingResult } from '../../types/index';
import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse } from '../../types/providers';
import type { BaseRedteamMetadata } from '../types';
import { type RawTracingConfig } from './tracingOptions';
/**
 * Represents metadata for the GOAT conversation process.
 */
interface GoatMetadata extends BaseRedteamMetadata {
    redteamFinalPrompt?: string;
    stopReason: 'Grader failed' | 'Max turns reached';
    successfulAttacks?: Array<{
        turn: number;
        prompt: string;
        response: string;
        traceSummary?: string;
    }>;
    totalSuccessfulAttacks?: number;
    storedGraderResult?: GradingResult;
    traceSnapshots?: Record<string, unknown>[];
}
/**
 * Represents the complete response from a GOAT conversation.
 */
interface GoatResponse extends ProviderResponse {
    metadata: GoatMetadata;
}
export interface ExtractAttackFailureResponse {
    message: string;
    task: string;
}
interface GoatConfig {
    injectVar: string;
    maxTurns: number;
    excludeTargetOutputFromAgenticAttackGeneration: boolean;
    stateful: boolean;
    continueAfterSuccess: boolean;
    tracing?: RawTracingConfig;
    [key: string]: unknown;
}
export default class GoatProvider implements ApiProvider {
    readonly config: GoatConfig;
    private readonly nunjucks;
    private successfulAttacks;
    id(): string;
    constructor(options?: ProviderOptions & {
        maxTurns?: number;
        injectVar?: string;
        stateful?: boolean;
        excludeTargetOutputFromAgenticAttackGeneration?: boolean;
        continueAfterSuccess?: boolean;
        tracing?: RawTracingConfig;
    });
    callApi(_prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<GoatResponse>;
}
export {};
//# sourceMappingURL=goat.d.ts.map