import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
export declare class DivergentRepetitionPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:divergent-repetition";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class DivergentRepetitionGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:divergent-repetition";
    rubric: string;
    getSuggestions({}: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=divergentRepetition.d.ts.map