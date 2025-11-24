"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const index_1 = require("../../src/util/index");
// Mock dependencies
jest.mock('../../src/database', () => ({
    getDb: jest.fn().mockReturnValue({
        select: jest.fn(),
        insert: jest.fn(),
        transaction: jest.fn(),
    }),
}));
jest.mock('../../src/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));
describe('JSONL output with proper line endings', () => {
    let tempDir;
    let tempFilePath;
    let mockEval;
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-jsonl-test-'));
        tempFilePath = path.join(tempDir, 'test-export.jsonl');
        mockEval = {
            id: 'test-eval-id',
            createdAt: '2025-01-01T00:00:00.000Z',
            author: 'test-author',
            config: { testConfig: true },
            prompts: [
                { raw: 'Test prompt 1', label: 'prompt1' },
                { raw: 'Test prompt 2', label: 'prompt2' },
            ],
            fetchResultsBatched: jest.fn(),
        };
    });
    afterEach(() => {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        fs.rmSync(tempDir, { recursive: true, force: true });
        jest.clearAllMocks();
    });
    it('should produce valid JSONL with proper line endings between batches', async () => {
        // Mock fetchResultsBatched to return multiple batches
        const batch1 = [
            { testIdx: 0, success: true, score: 1.0, output: 'result 1' },
            { testIdx: 1, success: true, score: 0.9, output: 'result 2' },
        ];
        const batch2 = [
            { testIdx: 2, success: true, score: 0.8, output: 'result 3' },
            { testIdx: 3, success: false, score: 0.0, output: 'result 4' },
        ];
        // Create async iterator for batches
        const batchIterator = [batch1, batch2];
        mockEval.fetchResultsBatched = jest.fn().mockImplementation(async function* () {
            for (const batch of batchIterator) {
                yield batch;
            }
        });
        await (0, index_1.writeOutput)(tempFilePath, mockEval, null);
        expect(fs.existsSync(tempFilePath)).toBe(true);
        const content = fs.readFileSync(tempFilePath, 'utf8');
        // Split by lines and filter out empty lines
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
        // Should have exactly 4 JSON objects (2 per batch)
        expect(lines).toHaveLength(4);
        // Each line should be valid JSON
        lines.forEach((line, index) => {
            expect(() => JSON.parse(line)).not.toThrow();
            const parsed = JSON.parse(line);
            expect(parsed).toHaveProperty('testIdx', index);
            expect(parsed).toHaveProperty('output', `result ${index + 1}`);
        });
        // File should end with a newline
        expect(content.endsWith('\n')).toBe(true);
    });
    it('should handle single batch correctly', async () => {
        const singleBatch = [{ testIdx: 0, success: true, score: 1.0, output: 'single result' }];
        mockEval.fetchResultsBatched = jest.fn().mockImplementation(async function* () {
            yield singleBatch;
        });
        await (0, index_1.writeOutput)(tempFilePath, mockEval, null);
        const content = fs.readFileSync(tempFilePath, 'utf8');
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
        expect(lines).toHaveLength(1);
        expect(() => JSON.parse(lines[0])).not.toThrow();
        expect(content.endsWith('\n')).toBe(true);
    });
    it('should handle empty batches gracefully', async () => {
        mockEval.fetchResultsBatched = jest.fn().mockImplementation(async function* () {
            yield [];
            yield [{ testIdx: 0, success: true, score: 1.0, output: 'after empty' }];
            yield [];
        });
        await (0, index_1.writeOutput)(tempFilePath, mockEval, null);
        const content = fs.readFileSync(tempFilePath, 'utf8');
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
        expect(lines).toHaveLength(1);
        expect(() => JSON.parse(lines[0])).not.toThrow();
        const parsed = JSON.parse(lines[0]);
        expect(parsed.output).toBe('after empty');
    });
    it('should use OS-specific line endings', async () => {
        const batch = [{ testIdx: 0, success: true, score: 1.0, output: 'test result' }];
        mockEval.fetchResultsBatched = jest.fn().mockImplementation(async function* () {
            yield batch;
        });
        await (0, index_1.writeOutput)(tempFilePath, mockEval, null);
        const content = fs.readFileSync(tempFilePath, 'utf8');
        // Content should end with the OS-specific line ending
        expect(content.endsWith(os.EOL)).toBe(true);
        // For multiple results, should use OS line endings between them
        const multiResultBatch = [
            { testIdx: 0, success: true, score: 1.0, output: 'result 1' },
            { testIdx: 1, success: true, score: 0.9, output: 'result 2' },
        ];
        mockEval.fetchResultsBatched = jest.fn().mockImplementation(async function* () {
            yield multiResultBatch;
        });
        // Clear the file
        fs.unlinkSync(tempFilePath);
        await (0, index_1.writeOutput)(tempFilePath, mockEval, null);
        const multiContent = fs.readFileSync(tempFilePath, 'utf8');
        const expectedContent = multiResultBatch.map((result) => JSON.stringify(result)).join(os.EOL) + os.EOL;
        expect(multiContent).toBe(expectedContent);
    });
});
//# sourceMappingURL=jsonlOutput.test.js.map