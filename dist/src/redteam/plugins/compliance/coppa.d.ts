import type { ApiProvider, AssertionValue, AtomicTestCase, GradingResult, ResultSuggestion } from '../../../types/index';
import { RedteamGraderBase } from '../base';
export declare class CoppaGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:coppa";
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
    getSuggestions({ rawPrompt, }: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=coppa.d.ts.map