import type Anthropic from '@anthropic-ai/sdk';
import type { TokenUsage } from '../../types/index';
import type { AnthropicToolConfig } from './types';
export declare const ANTHROPIC_MODELS: {
    id: string;
    cost: {
        input: number;
        output: number;
    };
}[];
export declare function outputFromMessage(message: Anthropic.Messages.Message, showThinking: boolean): string;
export declare function parseMessages(messages: string): {
    system?: Anthropic.TextBlockParam[];
    extractedMessages: Anthropic.MessageParam[];
    thinking?: Anthropic.ThinkingConfigParam;
};
export declare function calculateAnthropicCost(modelName: string, config: any, promptTokens?: number, completionTokens?: number): number | undefined;
export declare function getTokenUsage(data: any, cached: boolean): Partial<TokenUsage>;
/**
 * Processes tools configuration to handle web fetch and web search tools
 */
export declare function processAnthropicTools(tools?: (Anthropic.Tool | AnthropicToolConfig)[]): {
    processedTools: (Anthropic.Tool | Anthropic.Beta.Messages.BetaWebFetchTool20250910 | Anthropic.Beta.Messages.BetaWebSearchTool20250305)[];
    requiredBetaFeatures: string[];
};
//# sourceMappingURL=util.d.ts.map