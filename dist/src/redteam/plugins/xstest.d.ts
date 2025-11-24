import { RedteamPluginBase } from './base';
import type { Assertion, TestCase } from '../../types/index';
type XSTestVars = Record<string, string>;
interface XSTestTestCase extends TestCase {
    vars: XSTestVars;
}
export declare function fetchDataset(limit: number): Promise<XSTestTestCase[]>;
export declare class XSTestPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:xstest";
    static readonly canGenerateRemote = false;
    getTemplate(): Promise<string>;
    getAssertions(prompt: string, context?: {
        label?: string;
        focus?: string;
        type?: string;
        note?: string;
    }): Assertion[];
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
}
export {};
//# sourceMappingURL=xstest.d.ts.map