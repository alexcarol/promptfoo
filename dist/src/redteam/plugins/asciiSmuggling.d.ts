import { RedteamGraderBase, type RedteamGradingContext } from './base';
import type { ApiProvider, AssertionValue, AtomicTestCase, GradingResult } from '../../types/index';
export declare class AsciiSmugglingGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getResult(_prompt: string, llmOutput: string, test: AtomicTestCase, _provider?: ApiProvider, _renderedValue?: AssertionValue, _additionalRubric?: string, _skipRefusalCheck?: boolean, _gradingContext?: RedteamGradingContext): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=asciiSmuggling.d.ts.map