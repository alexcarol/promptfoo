import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, AssertionValue, ResultSuggestion, TestCase } from '../../types/index';
export declare class UnverifiableClaimsPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:unverifiable-claims";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
    protected promptsToTestCases(prompts: {
        prompt: string;
    }[]): TestCase[];
}
export declare class UnverifiableClaimsGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:unverifiable-claims";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=unverifiableClaims.d.ts.map