"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const import_1 = require("../../src/commands/import");
const index_1 = require("../../src/database/index");
const logger_1 = __importDefault(require("../../src/logger"));
const migrate_1 = require("../../src/migrate");
const eval_1 = __importDefault(require("../../src/models/eval"));
const evalResult_1 = __importDefault(require("../../src/models/evalResult"));
jest.mock('../../src/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
}));
jest.mock('../../src/telemetry', () => ({
    record: jest.fn(),
}));
describe('importCommand', () => {
    let program;
    let mockExit;
    let tempFilePath;
    beforeAll(async () => {
        await (0, migrate_1.runDbMigrations)();
    });
    beforeEach(async () => {
        program = new commander_1.Command();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        // Clear all tables before each test
        const db = (0, index_1.getDb)();
        // Delete related tables first
        db.run('DELETE FROM eval_results');
        db.run('DELETE FROM evals_to_datasets');
        db.run('DELETE FROM evals_to_prompts');
        db.run('DELETE FROM evals_to_tags');
        // Then delete from main table
        db.run('DELETE FROM evals');
    });
    afterEach(() => {
        jest.clearAllMocks();
        // Clean up temp file if it exists
        if (tempFilePath && fs_1.default.existsSync(tempFilePath)) {
            fs_1.default.unlinkSync(tempFilePath);
        }
    });
    describe('command registration', () => {
        it('should register the import command', () => {
            (0, import_1.importCommand)(program);
            const importCmd = program.commands.find((cmd) => cmd.name() === 'import');
            expect(importCmd).toBeDefined();
            expect(importCmd.description()).toBe('Import an eval record from a JSON file');
        });
    });
    describe('error handling', () => {
        it('should handle file read errors', async () => {
            (0, import_1.importCommand)(program);
            await program.parseAsync(['node', 'test', 'import', 'non-existent-file.json']);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringMatching(/Failed to import eval.*ENOENT/));
            expect(mockExit).toHaveBeenCalledWith(1);
        });
        it('should handle invalid JSON', async () => {
            const filePath = path_1.default.join(__dirname, `temp-invalid-${Date.now()}.json`);
            fs_1.default.writeFileSync(filePath, 'invalid json');
            tempFilePath = filePath;
            (0, import_1.importCommand)(program);
            await program.parseAsync(['node', 'test', 'import', filePath]);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringMatching(/Failed to import eval.*SyntaxError/));
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });
    describe('with real sample file', () => {
        it('should successfully import the sample export file into the database', async () => {
            const sampleFilePath = path_1.default.join(__dirname, '../__fixtures__/sample-export.json');
            // Get the sample data to verify import details
            const sampleData = JSON.parse(fs_1.default.readFileSync(sampleFilePath, 'utf-8'));
            (0, import_1.importCommand)(program);
            await program.parseAsync(['node', 'test', 'import', sampleFilePath]);
            // Check if the import process exited with an error
            expect(mockExit).not.toHaveBeenCalledWith(1);
            // Since the sample file doesn't have an 'id' field (only 'evalId'),
            // the import will generate a new ID. Let's find the imported eval by looking at all evals.
            const allEvals = await eval_1.default.getMany(1); // Get first eval
            expect(allEvals.length).toBe(1);
            const importedEval = allEvals[0];
            expect(importedEval).toBeDefined();
            expect(importedEval.id).toBeDefined();
            expect(importedEval.config).toBeDefined();
            expect(importedEval.prompts).toBeDefined();
            expect(importedEval.prompts.length).toBe(2); // Based on sample file having 2 prompts
            // Verify that the config matches what we expect from the sample file
            expect(importedEval.config.description).toBe(sampleData.config.description);
            expect(importedEval.config.providers).toEqual(sampleData.config.providers);
            // Also verify that eval results were imported
            const results = await evalResult_1.default.findManyByEvalId(importedEval.id);
            expect(results.length).toBe(4); // Based on sample file having 4 results
        });
    });
});
//# sourceMappingURL=import.test.js.map