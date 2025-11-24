import { RedteamGraderBase, RedteamPluginBase, type RedteamGradingContext } from './base';
import type { ApiProvider, Assertion, AtomicTestCase, AssertionValue, GradingResult, PluginConfig, TestCase } from '../../types/index';
export declare class IntentPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:intent";
    static readonly canGenerateRemote = false;
    private intents;
    constructor(provider: ApiProvider, purpose: string, injectVar: string, config: PluginConfig);
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
    generateTests(_n: number, delayMs: number): Promise<TestCase[]>;
}
export declare class IntentGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined, renderedValue?: AssertionValue, additionalRubric?: string, skipRefusalCheck?: boolean, gradingContext?: RedteamGradingContext): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=intent.d.ts.map