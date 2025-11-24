"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../src/assertions/index");
describe('max-score assertion integration', () => {
    it('should exclude max-score from regular assertion processing', async () => {
        const test = {
            assert: [
                { type: 'contains', value: 'test' },
                { type: 'max-score' },
            ],
        };
        const result = await (0, index_1.runAssertions)({
            prompt: 'test prompt',
            providerResponse: { output: 'test output' },
            test,
        });
        // Only the contains assertion should be processed
        expect(result.componentResults).toHaveLength(1);
        expect(result.componentResults[0].assertion?.type).toBe('contains');
    });
    it('should filter out select-best and max-score from processing', async () => {
        const test = {
            assert: [
                { type: 'contains', value: 'test' },
                { type: 'select-best', value: 'best criteria' },
                { type: 'max-score' },
                { type: 'equals', value: 'test output' },
            ],
        };
        const result = await (0, index_1.runAssertions)({
            prompt: 'test prompt',
            providerResponse: { output: 'test output' },
            test,
        });
        // Only contains and equals should be processed
        expect(result.componentResults).toHaveLength(2);
        const processedTypes = result.componentResults.map((cr) => cr.assertion?.type);
        expect(processedTypes).toEqual(['contains', 'equals']);
    });
});
//# sourceMappingURL=max-score.test.js.map