import type { ApiProvider, AtomicTestCase, CallApiContextParams, CallApiOptionsParams, GradingResult, GuardrailResponse, NunjucksFilterMap, Prompt, TokenUsage } from '../../types/index';
interface IterativeMetaMetadata {
    finalIteration: number;
    vulnerabilityAchieved: boolean;
    redteamFinalPrompt?: string;
    storedGraderResult?: GradingResult;
    stopReason: 'Grader failed' | 'Agent abandoned' | 'Max iterations reached';
    redteamHistory: {
        prompt: string;
        output: string;
        score: number;
        graderPassed: boolean | undefined;
        guardrails: GuardrailResponse | undefined;
    }[];
    sessionIds: string[];
}
export declare function runMetaAgentRedteam({ context, filters, injectVar, numIterations, options, prompt, agentProvider, gradingProvider, targetProvider, test, vars, excludeTargetOutputFromAgenticAttackGeneration, }: {
    context?: CallApiContextParams;
    filters: NunjucksFilterMap | undefined;
    injectVar: string;
    numIterations: number;
    options?: CallApiOptionsParams;
    prompt: Prompt;
    agentProvider: ApiProvider;
    gradingProvider: ApiProvider;
    targetProvider: ApiProvider;
    test?: AtomicTestCase;
    vars: Record<string, string | object>;
    excludeTargetOutputFromAgenticAttackGeneration?: boolean;
}): Promise<{
    output: string;
    metadata: IterativeMetaMetadata;
    tokenUsage: TokenUsage;
    error?: string;
}>;
declare class RedteamIterativeMetaProvider implements ApiProvider {
    readonly config: Record<string, string | object>;
    private readonly agentProvider;
    private readonly injectVar;
    private readonly numIterations;
    private readonly gradingProvider;
    private readonly excludeTargetOutputFromAgenticAttackGeneration;
    constructor(config: Record<string, string | object>);
    id(): string;
    callApi(_prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<{
        output: string;
        metadata: IterativeMetaMetadata;
        tokenUsage: TokenUsage;
    }>;
}
export default RedteamIterativeMetaProvider;
//# sourceMappingURL=iterativeMeta.d.ts.map