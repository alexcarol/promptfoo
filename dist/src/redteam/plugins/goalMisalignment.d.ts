import { RedteamGraderBase } from './base';
import type { AssertionValue, ResultSuggestion } from '../../types/index';
export declare class GoalMisalignmentGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        goal: string;
        prompt: string;
        output: string;
    }): string;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
        test: any;
    }): ResultSuggestion[];
}
//# sourceMappingURL=goalMisalignment.d.ts.map