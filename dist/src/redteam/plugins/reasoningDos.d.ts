import { RedteamGraderBase } from './base';
import type { AssertionValue, ResultSuggestion } from '../../types/index';
export declare class ReasoningDosGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=reasoningDos.d.ts.map