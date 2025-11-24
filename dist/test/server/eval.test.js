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
const supertest_1 = __importDefault(require("supertest"));
const migrate_1 = require("../../src/migrate");
const eval_1 = __importDefault(require("../../src/models/eval"));
const evalResult_1 = __importDefault(require("../../src/models/evalResult"));
const server_1 = require("../../src/server/server");
const invariant_1 = __importDefault(require("../../src/util/invariant"));
const evalFactory_1 = __importDefault(require("../factories/evalFactory"));
describe('eval routes', () => {
    let app;
    const testEvalIds = new Set();
    beforeAll(async () => {
        await (0, migrate_1.runDbMigrations)();
    });
    beforeEach(() => {
        app = (0, server_1.createApp)();
    });
    afterEach(async () => {
        // More robust cleanup with proper error handling
        const cleanupPromises = Array.from(testEvalIds).map(async (evalId) => {
            try {
                const eval_ = await eval_1.default.findById(evalId);
                if (eval_) {
                    await eval_.delete();
                }
            }
            catch (error) {
                // Log the error instead of silently ignoring it
                console.error(`Failed to cleanup eval ${evalId}:`, error);
            }
        });
        // Wait for all cleanups to complete
        await Promise.allSettled(cleanupPromises);
        testEvalIds.clear();
    });
    function createManualRatingPayload(originalResult, pass) {
        const payload = { ...originalResult.gradingResult };
        const score = pass ? 1 : 0;
        payload.componentResults?.push({
            pass,
            score,
            reason: 'Manual result (overrides all other grading results)',
            assertion: { type: 'human' },
        });
        payload.reason = 'Manual result (overrides all other grading results)';
        payload.pass = pass;
        payload.score = score;
        return payload;
    }
    describe('post("/:evalId/results/:id/rating")', () => {
        it('Passing test and the user marked it as passing (no change)', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            const results = await eval_.getResults();
            const result = results[0];
            expect(eval_.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(result.gradingResult?.pass).toBe(true);
            expect(result.gradingResult?.score).toBe(1);
            const ratingPayload = createManualRatingPayload(result, true);
            const res = await (0, supertest_1.default)(app)
                .post(`/api/eval/${eval_.id}/results/${result.id}/rating`)
                .send(ratingPayload);
            expect(res.status).toBe(200);
            (0, invariant_1.default)(result.id, 'Result ID is required');
            const updatedResult = await evalResult_1.default.findById(result.id);
            expect(updatedResult?.gradingResult?.pass).toBe(true);
            expect(updatedResult?.gradingResult?.score).toBe(1);
            expect(updatedResult?.gradingResult?.componentResults).toHaveLength(2);
            expect(updatedResult?.gradingResult?.reason).toBe('Manual result (overrides all other grading results)');
            const updatedEval = await eval_1.default.findById(eval_.id);
            (0, invariant_1.default)(updatedEval, 'Eval is required');
            expect(updatedEval.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertPassCount).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
        });
        it('Passing test and the user changed it to failing', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            const results = await eval_.getResults();
            const result = results[0];
            expect(eval_.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(result.gradingResult?.pass).toBe(true);
            expect(result.gradingResult?.score).toBe(1);
            const ratingPayload = createManualRatingPayload(result, false);
            const res = await (0, supertest_1.default)(app)
                .post(`/api/eval/${eval_.id}/results/${result.id}/rating`)
                .send(ratingPayload);
            expect(res.status).toBe(200);
            (0, invariant_1.default)(result.id, 'Result ID is required');
            const updatedResult = await evalResult_1.default.findById(result.id);
            expect(updatedResult?.gradingResult?.pass).toBe(false);
            expect(updatedResult?.gradingResult?.score).toBe(0);
            expect(updatedResult?.gradingResult?.componentResults).toHaveLength(2);
            expect(updatedResult?.gradingResult?.reason).toBe('Manual result (overrides all other grading results)');
            const updatedEval = await eval_1.default.findById(eval_.id);
            (0, invariant_1.default)(updatedEval, 'Eval is required');
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertFailCount).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.score).toBe(0);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testPassCount).toBe(0);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testFailCount).toBe(2);
        });
        it('Failing test and the user changed it to passing', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            const results = await eval_.getResults();
            const result = results[1];
            expect(eval_.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(result.gradingResult?.pass).toBe(false);
            expect(result.gradingResult?.score).toBe(0);
            const ratingPayload = createManualRatingPayload(result, true);
            const res = await (0, supertest_1.default)(app)
                .post(`/api/eval/${eval_.id}/results/${result.id}/rating`)
                .send(ratingPayload);
            expect(res.status).toBe(200);
            (0, invariant_1.default)(result.id, 'Result ID is required');
            const updatedResult = await evalResult_1.default.findById(result.id);
            expect(updatedResult?.gradingResult?.pass).toBe(true);
            expect(updatedResult?.gradingResult?.score).toBe(1);
            expect(updatedResult?.gradingResult?.componentResults).toHaveLength(2);
            expect(updatedResult?.gradingResult?.reason).toBe('Manual result (overrides all other grading results)');
            const updatedEval = await eval_1.default.findById(eval_.id);
            (0, invariant_1.default)(updatedEval, 'Eval is required');
            expect(updatedEval.prompts[result.promptIdx].metrics?.score).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertPassCount).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testPassCount).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testFailCount).toBe(0);
        });
        it('Failing test and the user marked it as failing (no change)', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            const results = await eval_.getResults();
            const result = results[1];
            expect(eval_.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.assertFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
            expect(eval_.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(result.gradingResult?.pass).toBe(false);
            expect(result.gradingResult?.score).toBe(0);
            const ratingPayload = createManualRatingPayload(result, false);
            const res = await (0, supertest_1.default)(app)
                .post(`/api/eval/${eval_.id}/results/${result.id}/rating`)
                .send(ratingPayload);
            expect(res.status).toBe(200);
            (0, invariant_1.default)(result.id, 'Result ID is required');
            const updatedResult = await evalResult_1.default.findById(result.id);
            expect(updatedResult?.gradingResult?.pass).toBe(false);
            expect(updatedResult?.gradingResult?.score).toBe(0);
            expect(updatedResult?.gradingResult?.componentResults).toHaveLength(2);
            expect(updatedResult?.gradingResult?.reason).toBe('Manual result (overrides all other grading results)');
            const updatedEval = await eval_1.default.findById(eval_.id);
            (0, invariant_1.default)(updatedEval, 'Eval is required');
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertPassCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.assertFailCount).toBe(2);
            expect(updatedEval.prompts[result.promptIdx].metrics?.score).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testPassCount).toBe(1);
            expect(updatedEval.prompts[result.promptIdx].metrics?.testFailCount).toBe(1);
        });
    });
    describe('GET /:id/metadata-keys', () => {
        it('should return metadata keys for valid eval', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            // Add eval results with metadata using direct database insert
            const { getDb } = await Promise.resolve().then(() => __importStar(require('../../src/database')));
            const db = getDb();
            await db.run(`INSERT INTO eval_results (
          id, eval_id, prompt_idx, test_idx, test_case, prompt, provider,
          success, score, metadata
        ) VALUES
        ('result1', '${eval_.id}', 0, 0, '{}', '{}', '{}', 1, 1.0, '{"key1": "value1", "key2": "value2"}'),
        ('result2', '${eval_.id}', 0, 1, '{}', '{}', '{}', 1, 1.0, '{"key2": "value3", "key3": "value4"}')`);
            const res = await (0, supertest_1.default)(app).get(`/api/eval/${eval_.id}/metadata-keys`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('keys');
            expect(res.body.keys).toEqual(expect.arrayContaining(['key1', 'key2', 'key3']));
        });
        it('should return 404 for non-existent eval', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/eval/non-existent-id/metadata-keys');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Eval not found');
        });
        it('should return empty keys array for eval with no metadata', async () => {
            const eval_ = await evalFactory_1.default.create();
            testEvalIds.add(eval_.id);
            const res = await (0, supertest_1.default)(app).get(`/api/eval/${eval_.id}/metadata-keys`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('keys');
            expect(res.body.keys).toEqual([]);
        });
    });
});
//# sourceMappingURL=eval.test.js.map