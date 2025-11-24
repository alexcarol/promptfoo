import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, GradingResult, ProviderResponse, RedteamFileConfig } from '../../../types/index';
import type { BaseRedteamMetadata } from '../../types';
import type { Message } from '../shared';
type StopReason = 'Grader failed' | 'Max rounds reached' | 'Max backtracks reached';
/**
 * Represents metadata for the Custom conversation process.
 */
export interface CustomMetadata extends BaseRedteamMetadata {
    customRoundsCompleted: number;
    customBacktrackCount: number;
    customResult: boolean;
    customConfidence: number | null;
    stopReason: StopReason;
    successfulAttacks?: Array<{
        turn: number;
        prompt: string;
        response: string;
    }>;
    totalSuccessfulAttacks?: number;
    storedGraderResult?: GradingResult;
}
/**
 * Represents the complete response from a Custom conversation.
 */
export interface CustomResponse extends ProviderResponse {
    metadata: CustomMetadata;
}
interface CustomConfig {
    injectVar: string;
    strategyText: string;
    maxTurns?: number;
    maxBacktracks?: number;
    redteamProvider: RedteamFileConfig['provider'];
    excludeTargetOutputFromAgenticAttackGeneration?: boolean;
    stateful?: boolean;
    continueAfterSuccess?: boolean;
}
export declare class MemorySystem {
    private conversations;
    addMessage(conversationId: string, message: Message): void;
    getConversation(conversationId: string): Message[];
    duplicateConversationExcludingLastTurn(conversationId: string): string;
}
export declare class CustomProvider implements ApiProvider {
    readonly config: CustomConfig;
    private readonly nunjucks;
    private userGoal;
    private redTeamProvider;
    private scoringProvider;
    private memory;
    private targetConversationId;
    private redTeamingChatConversationId;
    private maxTurns;
    private maxBacktracks;
    private stateful;
    private excludeTargetOutputFromAgenticAttackGeneration;
    private successfulAttacks;
    constructor(config: CustomConfig);
    private getRedTeamProvider;
    private getScoringProvider;
    id(): string;
    callApi(prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<CustomResponse>;
    private runAttack;
    private getAttackPrompt;
    private sendPrompt;
    private getRefusalScore;
    private getEvalScore;
    private backtrackMemory;
    private logChatHistory;
    private recordSuccessfulAttack;
}
export default CustomProvider;
//# sourceMappingURL=index.d.ts.map