import { RedteamGraderBase } from './base';
import type { AssertionValue, ResultSuggestion } from '../../types/index';
export declare class IndirectPromptInjectionGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getSuggestions({ rawPrompt, renderedValue, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
    private getDatamarkingSuggestion;
    private getEncodingSuggestion;
}
//# sourceMappingURL=indirectPromptInjection.d.ts.map