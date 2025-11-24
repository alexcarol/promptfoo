import type { Assertion, AssertionValue, ResultSuggestion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare class ContractPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:contracts";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class ContractsGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:contracts";
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=contracts.d.ts.map