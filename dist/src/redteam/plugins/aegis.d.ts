import { RedteamGraderBase, RedteamPluginBase, type RedteamGradingContext } from './base';
import type { ApiProvider, Assertion, AssertionValue, AtomicTestCase, GradingResult, TestCase } from '../../types/index';
export declare const DATASET_PATH = "huggingface://datasets/nvidia/Aegis-AI-Content-Safety-Dataset-1.0?split=train";
export declare function fetchDataset(limit: number): Promise<TestCase[]>;
export declare class AegisPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:aegis";
    static readonly canGenerateRemote = false;
    getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
}
export declare class AegisGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:aegis";
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined, renderedValue?: AssertionValue, additionalRubric?: string, skipRefusalCheck?: boolean, gradingContext?: RedteamGradingContext): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=aegis.d.ts.map