import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare class ImitationPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:imitation";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class ImitationGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:imitation";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=imitation.d.ts.map