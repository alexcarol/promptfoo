import type { TokenUsage } from './types/index';
interface GeneratePromptsOutput {
    prompts?: string[];
    error?: string;
    tokensUsed: TokenUsage;
}
export declare function generatePrompts(prompt: string, _num: number): Promise<GeneratePromptsOutput>;
export {};
//# sourceMappingURL=suggestions.d.ts.map