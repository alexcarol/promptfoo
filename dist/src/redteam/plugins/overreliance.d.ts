import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare class OverreliancePlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:overreliance";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class OverrelianceGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:overreliance";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=overreliance.d.ts.map