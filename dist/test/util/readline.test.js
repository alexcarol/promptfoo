"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const readline_2 = require("../../src/util/readline");
jest.mock('readline');
jest.mock('../../src/util/readline', () => ({
    createReadlineInterface: jest.fn(),
    promptUser: jest.fn(),
    promptYesNo: jest.fn(),
}));
describe('readline utils', () => {
    let mockInterface;
    beforeEach(() => {
        mockInterface = {
            question: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
        };
        jest.mocked(readline_1.default.createInterface).mockReturnValue(mockInterface);
        jest.mocked(readline_2.createReadlineInterface).mockReturnValue(mockInterface);
        jest.mocked(readline_2.promptUser).mockReset();
        jest.mocked(readline_2.promptYesNo).mockReset();
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });
    describe('createReadlineInterface', () => {
        it('should create readline interface with stdin/stdout', () => {
            const result = (0, readline_2.createReadlineInterface)();
            expect(readline_2.createReadlineInterface).toHaveBeenCalledWith();
            expect(result).toBe(mockInterface);
        });
    });
    describe('promptUser', () => {
        it('should resolve with user answer', async () => {
            const question = 'Test question?';
            const answer = 'Test answer';
            jest.mocked(readline_2.promptUser).mockResolvedValue(answer);
            const result = await (0, readline_2.promptUser)(question);
            expect(result).toBe(answer);
            expect(readline_2.promptUser).toHaveBeenCalledWith(question);
        });
        it('should reject on error', async () => {
            const error = new Error('Test error');
            jest.mocked(readline_2.promptUser).mockRejectedValue(error);
            await expect((0, readline_2.promptUser)('Test question?')).rejects.toThrow(error);
        });
        it('should reject if readline creation fails', async () => {
            const error = new Error('Creation failed');
            jest.mocked(readline_2.promptUser).mockRejectedValue(error);
            await expect((0, readline_2.promptUser)('Test question?')).rejects.toThrow(error);
        });
    });
    describe('promptYesNo', () => {
        it('should return true for "y" with default no', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValue(true);
            const result = await (0, readline_2.promptYesNo)('Test question?', false);
            expect(result).toBe(true);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', false);
        });
        it('should return false for "n" with default yes', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValue(false);
            const result = await (0, readline_2.promptYesNo)('Test question?', true);
            expect(result).toBe(false);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', true);
        });
        it('should return default value for empty response', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
            await expect((0, readline_2.promptYesNo)('Test question?', true)).resolves.toBe(true);
            await expect((0, readline_2.promptYesNo)('Test question?', false)).resolves.toBe(false);
        });
        it('should handle different case inputs', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
            await expect((0, readline_2.promptYesNo)('Test question?')).resolves.toBe(true);
            await expect((0, readline_2.promptYesNo)('Test question?', true)).resolves.toBe(false);
        });
        it('should append correct suffix based on default value', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValue(true);
            await (0, readline_2.promptYesNo)('Test question?', true);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', true);
            await (0, readline_2.promptYesNo)('Test question?', false);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', false);
        });
        it('should return true for non-n input with defaultYes true', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValue(true);
            const result = await (0, readline_2.promptYesNo)('Test question?', true);
            expect(result).toBe(true);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', true);
        });
        it('should return false for input not starting with y with defaultYes false', async () => {
            jest.mocked(readline_2.promptYesNo).mockResolvedValue(false);
            const result = await (0, readline_2.promptYesNo)('Test question?', false);
            expect(result).toBe(false);
            expect(readline_2.promptYesNo).toHaveBeenCalledWith('Test question?', false);
        });
    });
});
//# sourceMappingURL=readline.test.js.map