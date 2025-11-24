import { RedteamGraderBase } from '../base';
import type { ApiProvider, AtomicTestCase, GradingResult } from '../../../types/index';
export declare class FerpaGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:ferpa";
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=ferpa.d.ts.map