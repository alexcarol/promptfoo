import type { Assertion, TestCase, TestSuite } from '../types/index';
interface SynthesizeOptions {
    instructions?: string;
    numQuestions?: number;
    prompts: string[];
    provider?: string;
    tests: TestCase[];
    type?: 'pi' | 'g-eval' | 'llm-rubric';
}
export declare function generateNewQuestionsPrompt(prompts: string[], testCases: TestCase[], numQuestions: number): string;
export declare function convertQuestionToPythonPrompt(prompts: string[], question: string): string;
export declare function synthesize({ prompts, instructions, numQuestions, tests, provider, type, }: SynthesizeOptions): Promise<Assertion[]>;
export declare function synthesizeFromTestSuite(testSuite: TestSuite, options: Partial<SynthesizeOptions>): Promise<Assertion[]>;
export {};
//# sourceMappingURL=synthesis.d.ts.map