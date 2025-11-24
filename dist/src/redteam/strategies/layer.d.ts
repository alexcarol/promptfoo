import type { Strategy } from './types';
import type { TestCase, TestCaseWithPlugin } from '../../types/index';
export declare function addLayerTestCases(testCases: TestCaseWithPlugin[], injectVar: string, config: Record<string, any>, strategies: Strategy[], loadStrategy: (strategyPath: string) => Promise<Strategy>): Promise<TestCase[]>;
//# sourceMappingURL=layer.d.ts.map