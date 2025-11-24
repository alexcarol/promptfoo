import type { EnvOverrides } from '../types/env';
import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, PluginConfig, ProviderResponse } from '../types/index';
interface PromptfooHarmfulCompletionOptions {
    harmCategory: string;
    n: number;
    purpose: string;
    config?: PluginConfig;
}
/**
 * Provider for generating harmful/adversarial content using Promptfoo's unaligned models.
 * Used by red team plugins to generate test cases for harmful content categories.
 */
export declare class PromptfooHarmfulCompletionProvider implements ApiProvider {
    harmCategory: string;
    n: number;
    purpose: string;
    config?: PluginConfig;
    constructor(options: PromptfooHarmfulCompletionOptions);
    id(): string;
    toString(): string;
    callApi(_prompt: string, _context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse & {
        output?: string[];
    }>;
}
interface PromptfooChatCompletionOptions {
    env?: EnvOverrides;
    id?: string;
    jsonOnly: boolean;
    preferSmallModel: boolean;
    task: 'crescendo' | 'goat' | 'iterative' | 'iterative:image' | 'iterative:tree' | 'judge' | 'blocking-question-analysis' | 'meta-agent-decision' | 'hydra-decision';
}
/**
 * Provider for red team adversarial strategies using Promptfoo's task-specific models.
 * Supports multi-turn attack strategies like crescendo, goat, and iterative attacks.
 */
export declare class PromptfooChatCompletionProvider implements ApiProvider {
    private options;
    constructor(options: PromptfooChatCompletionOptions);
    id(): string;
    toString(): string;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
interface PromptfooAgentOptions {
    env?: EnvOverrides;
    id?: string;
    instructions?: string;
}
export declare const REDTEAM_SIMULATED_USER_TASK_ID = "mischievous-user-redteam";
/**
 * Provider for simulating realistic user conversations using Promptfoo's conversation models.
 * Supports both regular simulated users and adversarial red team users.
 */
export declare class PromptfooSimulatedUserProvider implements ApiProvider {
    private options;
    private taskId;
    constructor(options: PromptfooAgentOptions | undefined, taskId: string);
    id(): string;
    toString(): string;
    callApi(prompt: string, _context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=promptfoo.d.ts.map