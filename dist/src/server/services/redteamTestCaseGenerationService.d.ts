import { type MultiTurnStrategy, type Plugin } from '../../redteam/constants';
import type { ConversationMessage } from '../../redteam/types';
export declare class RemoteGenerationDisabledError extends Error {
    constructor();
}
type PluginWithConfig = {
    id: Plugin;
    config: Record<string, unknown>;
};
export declare function getPluginConfigurationError(plugin: PluginWithConfig): string | null;
type VarsCarrier = {
    vars?: Record<string, unknown>;
};
export declare function extractGeneratedPrompt(testCase: VarsCarrier, injectVar: string): string;
export interface MultiTurnPromptParams {
    pluginId: Plugin;
    strategyId: MultiTurnStrategy;
    strategyConfigRecord: Record<string, unknown>;
    history: ConversationMessage[] | undefined;
    turn: number;
    maxTurns?: number;
    goalOverride?: string;
    baseMetadata: Record<string, unknown>;
    generatedPrompt: string;
    purpose: string | null;
    stateful?: boolean;
}
export interface MultiTurnPromptResult {
    prompt: string;
    metadata: Record<string, unknown>;
}
export declare function generateMultiTurnPrompt(params: MultiTurnPromptParams): Promise<MultiTurnPromptResult>;
export {};
//# sourceMappingURL=redteamTestCaseGenerationService.d.ts.map