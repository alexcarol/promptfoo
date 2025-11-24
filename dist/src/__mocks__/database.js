"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.spansTable = exports.tracesTable = exports.llmOutputsRelations = exports.llmOutputs = exports.evalsToDatasetsRelations = exports.evalsToDatasets = exports.evalsToPromptsRelations = exports.evalsToPrompts = exports.evalsRelations = exports.evals = exports.datasetsRelations = exports.datasets = exports.promptsRelations = exports.prompts = exports.mockDbInstance = void 0;
exports.mockDbInstance = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
};
const mockRelations = jest.fn();
const mockSqliteTable = jest.fn().mockImplementation((tableName, schema) => {
    // You can customize this mock based on your testing needs
    return { tableName, schema };
});
exports.prompts = mockSqliteTable('prompts', {
/* schema definition */
});
exports.promptsRelations = mockRelations;
exports.datasets = mockSqliteTable('datasets', {
/* schema definition */
});
exports.datasetsRelations = mockRelations;
exports.evals = mockSqliteTable('evals', {
/* schema definition */
});
exports.evalsRelations = mockRelations;
exports.evalsToPrompts = mockSqliteTable('evals_to_prompts', {
/* schema definition */
});
exports.evalsToPromptsRelations = mockRelations;
exports.evalsToDatasets = mockSqliteTable('evals_to_datasets', {
/* schema definition */
});
exports.evalsToDatasetsRelations = mockRelations;
exports.llmOutputs = mockSqliteTable('llm_outputs', {
/* schema definition */
});
exports.llmOutputsRelations = mockRelations;
exports.tracesTable = mockSqliteTable('traces', {
/* schema definition */
});
exports.spansTable = mockSqliteTable('spans', {
/* schema definition */
});
exports.getDb = jest.fn(() => exports.mockDbInstance);
//# sourceMappingURL=database.js.map