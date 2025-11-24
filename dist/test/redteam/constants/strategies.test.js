"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strategies_1 = require("../../../src/redteam/constants/strategies");
describe('strategies constants', () => {
    it('should have all strategies sorted', () => {
        const expectedStrategies = new Set([
            'default',
            'basic',
            'jailbreak',
            'jailbreak:composite',
            ...strategies_1.AGENTIC_STRATEGIES,
            ...strategies_1.ADDITIONAL_STRATEGIES,
            ...strategies_1.STRATEGY_COLLECTIONS,
        ]);
        expect(strategies_1.ALL_STRATEGIES).toEqual(Array.from(expectedStrategies).sort());
    });
    it('should correctly identify custom strategies', () => {
        expect((0, strategies_1.isCustomStrategy)('custom')).toBe(true);
        expect((0, strategies_1.isCustomStrategy)('custom:test')).toBe(true);
        expect((0, strategies_1.isCustomStrategy)('other')).toBe(false);
    });
    it('should expose fan-out metadata for supported strategies', () => {
        expect((0, strategies_1.isFanoutStrategy)('jailbreak:composite')).toBe(true);
        expect((0, strategies_1.getDefaultNFanout)('jailbreak:composite')).toBeGreaterThanOrEqual(1);
        expect((0, strategies_1.isFanoutStrategy)('gcg')).toBe(true);
        expect((0, strategies_1.getDefaultNFanout)('gcg')).toBeGreaterThanOrEqual(1);
        expect((0, strategies_1.isFanoutStrategy)('base64')).toBe(false);
    });
});
//# sourceMappingURL=strategies.test.js.map