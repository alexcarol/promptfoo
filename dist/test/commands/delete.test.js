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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const confirm_1 = __importDefault(require("@inquirer/confirm"));
const commander_1 = require("commander");
const delete_1 = require("../../src/commands/delete");
const logger_1 = __importDefault(require("../../src/logger"));
const eval_1 = __importDefault(require("../../src/models/eval"));
const database = __importStar(require("../../src/util/database"));
jest.mock('@inquirer/confirm');
jest.mock('../../src/util/database');
jest.mock('../../src/logger');
jest.mock('../../src/models/eval');
describe('delete command', () => {
    let program;
    beforeEach(() => {
        program = new commander_1.Command();
        jest.resetAllMocks();
        process.exitCode = undefined;
    });
    describe('handleEvalDelete', () => {
        it('should successfully delete evaluation', async () => {
            await (0, delete_1.handleEvalDelete)('test-id');
            expect(database.deleteEval).toHaveBeenCalledWith('test-id');
            expect(logger_1.default.info).toHaveBeenCalledWith('Evaluation with ID test-id has been successfully deleted.');
        });
        it('should handle error when deleting evaluation', async () => {
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
            const error = new Error('Delete failed');
            jest.mocked(database.deleteEval).mockRejectedValueOnce(error);
            await (0, delete_1.handleEvalDelete)('test-id');
            expect(logger_1.default.error).toHaveBeenCalledWith('Could not delete evaluation with ID test-id:\nError: Delete failed');
            expect(mockExit).toHaveBeenCalledWith(1);
            mockExit.mockRestore();
        });
    });
    describe('handleEvalDeleteAll', () => {
        it('should delete all evaluations when confirmed', async () => {
            jest.mocked(confirm_1.default).mockResolvedValueOnce(true);
            await (0, delete_1.handleEvalDeleteAll)();
            expect(database.deleteAllEvals).toHaveBeenCalledWith();
            expect(logger_1.default.info).toHaveBeenCalledWith('All evaluations have been deleted.');
        });
        it('should not delete evaluations when not confirmed', async () => {
            jest.mocked(confirm_1.default).mockResolvedValueOnce(false);
            await (0, delete_1.handleEvalDeleteAll)();
            expect(database.deleteAllEvals).not.toHaveBeenCalled();
        });
    });
    describe('delete command', () => {
        it('should handle eval deletion when resource exists', async () => {
            const mockEval = {
                id: 'test-id',
                date: new Date(),
                config: {},
                version: 3,
                timestamp: new Date().toISOString(),
                results: {
                    version: 3,
                    timestamp: new Date().toISOString(),
                    results: [],
                    prompts: [],
                    stats: {
                        successes: 0,
                        failures: 0,
                        errors: 0,
                        duration: 0,
                        tokenUsage: {
                            total: 0,
                            prompt: 0,
                            completion: 0,
                            cached: 0,
                            numRequests: 0,
                            completionDetails: {
                                reasoning: 0,
                                acceptedPrediction: 0,
                                rejectedPrediction: 0,
                            },
                            assertions: {},
                        },
                    },
                },
                prompts: [],
                stats: {
                    successes: 0,
                    failures: 0,
                    errors: 0,
                    duration: 0,
                    tokenUsage: {
                        total: 0,
                        prompt: 0,
                        completion: 0,
                        cached: 0,
                        numRequests: 0,
                        completionDetails: {
                            reasoning: 0,
                            acceptedPrediction: 0,
                            rejectedPrediction: 0,
                        },
                        assertions: {},
                    },
                },
            };
            jest.mocked(database.getEvalFromId).mockResolvedValueOnce(mockEval);
            (0, delete_1.deleteCommand)(program);
            await program.parseAsync(['node', 'test', 'delete', 'test-id']);
            expect(database.getEvalFromId).toHaveBeenCalledWith('test-id');
            expect(database.deleteEval).toHaveBeenCalledWith('test-id');
        });
        it('should handle when resource does not exist', async () => {
            jest.mocked(database.getEvalFromId).mockResolvedValueOnce(undefined);
            (0, delete_1.deleteCommand)(program);
            await program.parseAsync(['node', 'test', 'delete', 'test-id']);
            expect(logger_1.default.error).toHaveBeenCalledWith('No resource found with ID test-id');
            expect(process.exitCode).toBe(1);
        });
        describe('eval subcommand', () => {
            it('should handle latest eval deletion', async () => {
                const mockLatestEval = {
                    createdAt: new Date(),
                    config: {},
                    results: [],
                    prompts: [],
                    assertions: [],
                    vars: {},
                    providers: [],
                    tests: [],
                    outputs: [],
                    sharing: false,
                    description: '',
                    nunjucksTemplates: {},
                    version: 3,
                    grading: {},
                    metrics: {},
                    stats: {
                        successes: 0,
                        failures: 0,
                        errors: 0,
                        duration: 0,
                        tokenUsage: {
                            total: 0,
                            prompt: 0,
                            completion: 0,
                            cached: 0,
                            numRequests: 0,
                            completionDetails: {
                                reasoning: 0,
                                acceptedPrediction: 0,
                                rejectedPrediction: 0,
                            },
                            assertions: {},
                        },
                    },
                    duration: 0,
                    summary: '',
                    status: 'completed',
                    error: null,
                    testSuites: [],
                    maxConcurrency: 1,
                    repeat: 1,
                    table: [],
                    views: [],
                    isUnfinished: false,
                    isShared: false,
                    latestGrade: null,
                    latestScore: null,
                    id: 'latest-id',
                };
                jest.mocked(eval_1.default.latest).mockResolvedValueOnce(mockLatestEval);
                (0, delete_1.deleteCommand)(program);
                await program.parseAsync(['node', 'test', 'delete', 'eval', 'latest']);
                expect(database.deleteEval).toHaveBeenCalledWith('latest-id');
            });
            it('should handle when no latest eval exists', async () => {
                jest.mocked(eval_1.default.latest).mockResolvedValueOnce(undefined);
                (0, delete_1.deleteCommand)(program);
                await program.parseAsync(['node', 'test', 'delete', 'eval', 'latest']);
                expect(logger_1.default.error).toHaveBeenCalledWith('No eval found.');
                expect(process.exitCode).toBe(1);
            });
            it('should handle all evals deletion', async () => {
                jest.mocked(confirm_1.default).mockResolvedValueOnce(true);
                (0, delete_1.deleteCommand)(program);
                await program.parseAsync(['node', 'test', 'delete', 'eval', 'all']);
                expect(database.deleteAllEvals).toHaveBeenCalledWith();
            });
            it('should handle specific eval deletion', async () => {
                (0, delete_1.deleteCommand)(program);
                await program.parseAsync(['node', 'test', 'delete', 'eval', 'specific-id']);
                expect(database.deleteEval).toHaveBeenCalledWith('specific-id');
            });
        });
    });
});
//# sourceMappingURL=delete.test.js.map