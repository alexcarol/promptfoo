import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse, TokenUsage } from '../types/index';
export type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};
type AgentProviderOptions = ProviderOptions & {
    config?: {
        userProvider?: ProviderOptions;
        instructions?: string;
        maxTurns?: number;
        stateful?: boolean;
        /**
         * Pre-defined conversation history to start from.
         * Can be an array of Message objects or a file:// path to JSON/YAML.
         * Useful for testing specific conversation states or reproducing bugs.
         */
        initialMessages?: Message[] | string;
    };
};
/**
 * TODO(Will): Ideally this class is an Abstract Base Class that's implemented by the
 * Redteam and Non-Redteam SimulatedUser Providers. Address this in a follow-up PR.
 */
export declare class SimulatedUser implements ApiProvider {
    private readonly identifier;
    private readonly maxTurns;
    private readonly rawInstructions;
    private readonly stateful;
    private readonly configInitialMessages?;
    /**
     * Because the SimulatedUser is inherited by the RedteamMischievousUserProvider, and different
     * Cloud tasks are used for each, the taskId needs to be explicitly defined/scoped.
     */
    readonly taskId: string;
    constructor({ id, label, config }: AgentProviderOptions);
    id(): string;
    /**
     * Validates that a message has the required structure.
     */
    private isValidMessage;
    /**
     * Safely renders a Nunjucks template string, falling back to the original value on error.
     */
    private renderTemplate;
    /**
     * Validates and filters an array of messages, logging warnings for invalid entries.
     */
    private validateMessages;
    /**
     * Resolves initial messages from either an array or a file:// path.
     * Supports loading messages from JSON and YAML files.
     */
    private resolveInitialMessages;
    private sendMessageToUser;
    private sendMessageToAgent;
    callApi(_prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
    toString(): string;
    serializeOutput(messages: Message[], tokenUsage: TokenUsage, finalTargetResponse: ProviderResponse, sessionId?: string): {
        output: string;
        tokenUsage: {
            prompt?: number | undefined;
            completion?: number | undefined;
            cached?: number | undefined;
            total?: number | undefined;
            numRequests?: number | undefined;
            completionDetails?: {
                reasoning?: number | undefined;
                acceptedPrediction?: number | undefined;
                rejectedPrediction?: number | undefined;
            } | undefined;
            assertions?: {
                prompt?: number | undefined;
                completion?: number | undefined;
                cached?: number | undefined;
                total?: number | undefined;
                numRequests?: number | undefined;
                completionDetails?: {
                    reasoning?: number | undefined;
                    acceptedPrediction?: number | undefined;
                    rejectedPrediction?: number | undefined;
                } | undefined;
            } | undefined;
        };
        metadata: {
            messages: Message[];
            sessionId: string | undefined;
        };
        guardrails: import("../types/providers").GuardrailResponse | undefined;
    };
}
export {};
//# sourceMappingURL=simulatedUser.d.ts.map