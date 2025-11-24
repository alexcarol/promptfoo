import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, TestCase } from '../../types/index';
export declare function fetchDataset(limit: number): Promise<TestCase[]>;
export declare class ToxicChatPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:toxic-chat";
    static readonly canGenerateRemote = false;
    getTemplate(): Promise<string>;
    getAssertions(_prompt: string): Assertion[];
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
}
export declare class ToxicChatGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:toxic-chat";
    rubric: string;
}
//# sourceMappingURL=toxicChat.d.ts.map