import type { ApiProvider, AtomicTestCase, GradingResult } from '../../types/index';
import { RedteamGraderBase } from './base';
export declare class WordplayGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:wordplay";
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=wordplay.d.ts.map