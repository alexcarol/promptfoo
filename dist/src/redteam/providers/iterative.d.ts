import type { ApiProvider, AtomicTestCase, CallApiContextParams, CallApiOptionsParams, GradingResult, GuardrailResponse, NunjucksFilterMap, Prompt, TokenUsage } from '../../types/index';
type StopReason = 'Grader failed' | 'Max iterations reached';
interface IterativeMetadata {
    finalIteration: number;
    highestScore: number;
    redteamFinalPrompt?: string;
    storedGraderResult?: GradingResult;
    stopReason: StopReason;
    redteamHistory: {
        prompt: string;
        output: string;
        score: number;
        graderPassed: boolean | undefined;
        guardrails: GuardrailResponse | undefined;
        trace?: Record<string, unknown>;
        traceSummary?: string;
    }[];
    sessionIds: string[];
    traceSnapshots?: Record<string, unknown>[];
}
export declare function runRedteamConversation({ context, filters, injectVar, numIterations, options, prompt, redteamProvider, gradingProvider, targetProvider, test, vars, excludeTargetOutputFromAgenticAttackGeneration, }: {
    context?: CallApiContextParams;
    filters: NunjucksFilterMap | undefined;
    injectVar: string;
    numIterations: number;
    options?: CallApiOptionsParams;
    prompt: Prompt;
    redteamProvider: ApiProvider;
    gradingProvider: ApiProvider;
    targetProvider: ApiProvider;
    test?: AtomicTestCase;
    vars: Record<string, string | object>;
    excludeTargetOutputFromAgenticAttackGeneration: boolean;
}): Promise<{
    output: string;
    metadata: IterativeMetadata;
    tokenUsage: TokenUsage;
    error?: string;
}>;
declare class RedteamIterativeProvider implements ApiProvider {
    readonly config: Record<string, string | object>;
    private readonly redteamProvider;
    private readonly injectVar;
    private readonly numIterations;
    private readonly excludeTargetOutputFromAgenticAttackGeneration;
    private readonly gradingProvider;
    constructor(config: Record<string, string | object>);
    id(): string;
    callApi(_prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<{
        output: string;
        metadata: IterativeMetadata;
        tokenUsage: TokenUsage;
    }>;
}
export default RedteamIterativeProvider;
//# sourceMappingURL=iterative.d.ts.map