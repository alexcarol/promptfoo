"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mischievousUser_1 = require("../../../src/redteam/strategies/mischievousUser");
(0, globals_1.describe)('Mischievous User Strategy', () => {
    (0, globals_1.it)('should add mischievous user configuration to test cases', () => {
        const testCases = [
            {
                vars: { instructions: 'hi' },
                assert: [{ type: 'contains', metric: 'exactMatch', value: 'expected' }],
            },
        ];
        const result = (0, mischievousUser_1.addMischievousUser)(testCases, 'instructions', { maxTurns: 3 });
        (0, globals_1.expect)(result).toHaveLength(1);
        (0, globals_1.expect)(result[0].provider).toEqual({
            id: 'promptfoo:redteam:mischievous-user',
            config: { injectVar: 'instructions', maxTurns: 3 },
        });
        (0, globals_1.expect)(result[0].assert?.[0].metric).toBe('exactMatch/MischievousUser');
        (0, globals_1.expect)(result[0].metadata).toEqual({ strategyId: 'mischievous-user' });
    });
});
//# sourceMappingURL=mischievousUser.test.js.map