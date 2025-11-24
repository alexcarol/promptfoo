import { type ApiProvider, type CallApiContextParams, type CallApiOptionsParams, type EvaluateResult, type ProviderOptions, type ProviderResponse } from '../../types/index';
import { Message } from './shared';
interface Config {
    injectVar: string;
    goals: string[];
    purpose: string;
    additionalAttackInstructions?: string;
    maxConversationRounds: number;
    maxAttacksPerGoal: number;
    concurrency: number;
    sessionId?: string;
    stateful: boolean;
}
interface ConfigOptions {
    injectVar: string;
    goals?: string[];
    purpose?: string;
    additionalAttackInstructions?: string;
    maxConversationRounds?: number;
    maxAttacksPerGoal?: number;
    concurrency?: number;
    sessionId?: string;
    stateful?: boolean;
}
export declare function buildRedteamHistory(messages: Message[]): {
    prompt: string;
    output: string;
}[];
export default class SimbaProvider implements ApiProvider {
    readonly config: Config;
    private sessionId;
    id(): string;
    constructor(options?: ProviderOptions & ConfigOptions);
    callApi(_prompt: string, _context?: CallApiContextParams, _options?: CallApiOptionsParams): Promise<ProviderResponse>;
    get displayName(): string;
    private callSimbaApi;
    private startSession;
    private getFinalOutput;
    private getOrCreateAttack;
    private processOperation;
    runSimba({ prompt, context, options, concurrency, }: {
        prompt: string;
        context?: CallApiContextParams;
        options?: CallApiOptionsParams;
        concurrency?: number;
    }): Promise<EvaluateResult[]>;
    private buildEvaluateResult;
}
export {};
//# sourceMappingURL=simba.d.ts.map