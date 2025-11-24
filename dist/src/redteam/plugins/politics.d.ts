import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare class PoliticsPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:politics";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class PoliticsGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:politics";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=politics.d.ts.map