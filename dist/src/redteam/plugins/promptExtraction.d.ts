import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { ApiProvider, Assertion, PluginConfig, TestCase } from '../../types/index';
export declare class PromptExtractionPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:prompt-extraction";
    private systemPrompt;
    constructor(provider: ApiProvider, purpose: string, injectVar: string, config: PluginConfig);
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
    generateTests(n: number, _delayMs: number): Promise<TestCase[]>;
}
export declare class PromptExtractionGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:prompt-extraction";
    rubric: string;
}
//# sourceMappingURL=promptExtraction.d.ts.map