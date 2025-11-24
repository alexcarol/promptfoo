import type { GradingConfig, GradingResult } from '../../types/index';
export interface Message {
    input: string;
    output: string | object;
}
export declare function matchesConversationRelevance(messages: Message[], threshold: number, vars?: Record<string, string | object>, grading?: GradingConfig): Promise<Omit<GradingResult, 'assertion'>>;
//# sourceMappingURL=deepeval.d.ts.map