import type { TestCase } from '../../types/index';
export declare function getFallbackBase64(text: string): string;
export declare function createProgressBar(total: number): {
    increment: () => void;
    stop: () => void;
};
export declare function addVideoToBase64(testCases: TestCase[], injectVar: string, videoGenerator?: (text: string) => Promise<string>): Promise<TestCase[]>;
export declare function writeVideoFile(base64Video: string, outputFilePath: string): Promise<void>;
//# sourceMappingURL=simpleVideo.d.ts.map