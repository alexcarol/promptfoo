import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
export declare class ExcessiveAgencyPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:excessive-agency";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class ExcessiveAgencyGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:excessive-agency";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=excessiveAgency.d.ts.map