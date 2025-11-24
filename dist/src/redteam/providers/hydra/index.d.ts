import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, GradingResult, ProviderResponse } from '../../../types/index';
import type { BaseRedteamMetadata } from '../../types';
interface HydraMetadata extends BaseRedteamMetadata {
    hydraRoundsCompleted: number;
    hydraBacktrackCount: number;
    hydraResult: boolean;
    stopReason: 'Grader failed' | 'Max turns reached' | 'Max backtracks reached';
    successfulAttacks?: Array<{
        turn: number;
        message: string;
        response: string;
    }>;
    totalSuccessfulAttacks?: number;
    storedGraderResult?: GradingResult;
    redteamHistory: Array<{
        prompt: string;
        output: string;
        graderPassed: boolean | undefined;
    }>;
    sessionIds: string[];
}
interface HydraResponse extends ProviderResponse {
    metadata: HydraMetadata;
}
interface HydraConfig {
    injectVar: string;
    scanId?: string;
    maxTurns?: number;
    maxBacktracks?: number;
    stateful?: boolean;
    excludeTargetOutputFromAgenticAttackGeneration?: boolean;
}
export declare class HydraProvider implements ApiProvider {
    readonly config: HydraConfig;
    private scanId?;
    private readonly agentProvider;
    private readonly injectVar;
    private readonly maxTurns;
    private readonly maxBacktracks;
    private readonly stateful;
    private readonly excludeTargetOutputFromAgenticAttackGeneration;
    private conversationHistory;
    private sessionId?;
    constructor(config: HydraConfig);
    id(): string;
    callApi(_prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<HydraResponse>;
    private runAttack;
}
export default HydraProvider;
//# sourceMappingURL=index.d.ts.map