import { RedteamGraderBase } from './base';
import type { AssertionValue, ResultSuggestion } from '../../types/index';
export declare class CompetitorsGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getSuggestions({ rawPrompt, test, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
        test: any;
    }): ResultSuggestion[];
}
//# sourceMappingURL=competitors.d.ts.map