"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const show_1 = require("../../src/commands/show");
const logger_1 = __importDefault(require("../../src/logger"));
const eval_1 = __importDefault(require("../../src/models/eval"));
const database_1 = require("../../src/util/database");
jest.mock('../../src/logger');
jest.mock('../../src/models/eval');
jest.mock('../../src/util/database');
describe('show command', () => {
    let program;
    beforeEach(() => {
        program = new commander_1.Command();
        jest.resetAllMocks();
        process.exitCode = undefined;
    });
    describe('show [id]', () => {
        it('should show latest eval if no id provided', async () => {
            const mockLatestEval = {
                id: 'latest123',
                createdAt: new Date(),
                config: {},
                results: [],
                prompts: [],
                vars: [],
                testResults: [],
                metrics: {},
                getTable: jest.fn().mockResolvedValue({
                    head: { prompts: [], vars: [] },
                    body: [],
                }),
            };
            jest.mocked(eval_1.default.latest).mockResolvedValue(mockLatestEval);
            jest.mocked(eval_1.default.findById).mockResolvedValue(mockLatestEval);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show']);
            expect(eval_1.default.latest).toHaveBeenCalledWith();
        });
        it('should show error if no eval found and no id provided', async () => {
            jest.mocked(eval_1.default.latest).mockResolvedValue(undefined);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show']);
            expect(logger_1.default.error).toHaveBeenCalledWith('No eval found');
            expect(process.exitCode).toBe(1);
        });
        it('should show eval if id matches eval', async () => {
            const evalId = 'eval123';
            const mockEval = {
                id: evalId,
                date: new Date(),
                config: {},
                results: [],
                getTable: jest.fn().mockResolvedValue({
                    head: { prompts: [], vars: [] },
                    body: [],
                }),
            };
            jest.mocked(database_1.getEvalFromId).mockResolvedValue(mockEval);
            jest.mocked(eval_1.default.findById).mockResolvedValue(mockEval);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', evalId]);
            expect(database_1.getEvalFromId).toHaveBeenCalledWith(evalId);
        });
        it('should show prompt if id matches prompt', async () => {
            const promptId = 'prompt123';
            const mockPrompt = {
                raw: 'test',
                label: 'Test Prompt',
            };
            jest.mocked(database_1.getPromptFromHash).mockResolvedValue({
                id: promptId,
                prompt: mockPrompt,
                evals: [],
            });
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', promptId]);
            expect(database_1.getPromptFromHash).toHaveBeenCalledWith(promptId);
        });
        it('should show dataset if id matches dataset', async () => {
            const datasetId = 'dataset123';
            jest.mocked(database_1.getDatasetFromHash).mockResolvedValue({
                id: datasetId,
                prompts: [],
                recentEvalDate: new Date(),
                recentEvalId: 'eval123',
                count: 0,
                testCases: [],
            });
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', datasetId]);
            expect(database_1.getDatasetFromHash).toHaveBeenCalledWith(datasetId);
        });
        it('should show error if no resource found with id', async () => {
            const invalidId = 'invalid123';
            jest.mocked(database_1.getEvalFromId).mockResolvedValue(undefined);
            jest.mocked(database_1.getPromptFromHash).mockResolvedValue(undefined);
            jest.mocked(database_1.getDatasetFromHash).mockResolvedValue(undefined);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', invalidId]);
            expect(logger_1.default.error).toHaveBeenCalledWith(`No resource found with ID ${invalidId}`);
        });
    });
    describe('show eval [id]', () => {
        it('should show latest eval if no id provided', async () => {
            const mockLatestEval = {
                id: 'latest123',
                createdAt: new Date(),
                config: {},
                results: [],
                prompts: [],
                vars: [],
                testResults: [],
                metrics: {},
                getTable: jest.fn().mockResolvedValue({
                    head: { prompts: [], vars: [] },
                    body: [],
                }),
            };
            jest.mocked(eval_1.default.latest).mockResolvedValue(mockLatestEval);
            jest.mocked(eval_1.default.findById).mockResolvedValue(mockLatestEval);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', 'eval']);
            expect(eval_1.default.latest).toHaveBeenCalledWith();
        });
        it('should show error if no eval found and no id provided', async () => {
            jest.mocked(eval_1.default.latest).mockResolvedValue(undefined);
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', 'eval']);
            expect(logger_1.default.error).toHaveBeenCalledWith('No eval found');
            expect(process.exitCode).toBe(1);
        });
        it('should show eval details for provided id', async () => {
            const evalId = 'eval123';
            jest.mocked(eval_1.default.findById).mockResolvedValue({
                id: evalId,
                createdAt: new Date(),
                config: {},
                results: [],
                prompts: [],
                vars: [],
                testResults: [],
                metrics: {},
                getTable: jest.fn().mockResolvedValue({
                    head: { prompts: [], vars: [] },
                    body: [],
                }),
            });
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', 'eval', evalId]);
            expect(eval_1.default.findById).toHaveBeenCalledWith(evalId);
        });
    });
    describe('show prompt', () => {
        it('should show prompt details', async () => {
            const promptId = 'prompt123';
            const mockPrompt = {
                raw: 'test',
                label: 'Test Prompt',
            };
            jest.mocked(database_1.getPromptFromHash).mockResolvedValue({
                id: promptId,
                prompt: mockPrompt,
                evals: [],
            });
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', 'prompt', promptId]);
            expect(database_1.getPromptFromHash).toHaveBeenCalledWith(promptId);
        });
    });
    describe('show dataset', () => {
        it('should show dataset details', async () => {
            const datasetId = 'dataset123';
            jest.mocked(database_1.getDatasetFromHash).mockResolvedValue({
                id: datasetId,
                prompts: [],
                recentEvalDate: new Date(),
                recentEvalId: 'eval123',
                count: 0,
                testCases: [],
            });
            await (0, show_1.showCommand)(program);
            await program.parseAsync(['node', 'test', 'show', 'dataset', datasetId]);
            expect(database_1.getDatasetFromHash).toHaveBeenCalledWith(datasetId);
        });
    });
});
describe('handlers', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.exitCode = undefined;
    });
    describe('handlePrompt', () => {
        it('should handle prompt not found', async () => {
            const promptId = 'nonexistent';
            jest.mocked(database_1.getPromptFromHash).mockResolvedValue(undefined);
            await (0, show_1.handlePrompt)(promptId);
            expect(logger_1.default.error).toHaveBeenCalledWith(`Prompt with ID ${promptId} not found.`);
        });
    });
    describe('handleEval', () => {
        it('should handle eval not found', async () => {
            const evalId = 'nonexistent';
            jest.mocked(eval_1.default.findById).mockResolvedValue(undefined);
            await (0, show_1.handleEval)(evalId);
            expect(logger_1.default.error).toHaveBeenCalledWith(`No evaluation found with ID ${evalId}`);
        });
    });
    describe('handleDataset', () => {
        it('should handle dataset not found', async () => {
            const datasetId = 'nonexistent';
            jest.mocked(database_1.getDatasetFromHash).mockResolvedValue(undefined);
            await (0, show_1.handleDataset)(datasetId);
            expect(logger_1.default.error).toHaveBeenCalledWith(`Dataset with ID ${datasetId} not found.`);
        });
    });
});
//# sourceMappingURL=show.test.js.map