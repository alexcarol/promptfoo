import type { TestCase } from '../types/index';
export declare class AssertValidationError extends Error {
    constructor(message: string, testCase: TestCase);
}
export declare function validateAssertions(tests: TestCase[]): void;
//# sourceMappingURL=validateAssertions.d.ts.map