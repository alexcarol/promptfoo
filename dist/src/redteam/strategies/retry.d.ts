import type { TestCase, TestCaseWithPlugin } from '../../types/index';
export declare function deduplicateTests(tests: TestCase[]): TestCase[];
export declare function addRetryTestCases(testCases: TestCaseWithPlugin[], injectVar: string, config: Record<string, unknown>): Promise<TestCase[]>;
//# sourceMappingURL=retry.d.ts.map