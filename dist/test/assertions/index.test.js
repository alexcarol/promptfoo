"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../src/assertions/index");
describe('isAssertionInverse', () => {
    it('returns true if the assertion is inverse', () => {
        const assertion = {
            type: 'not-equals',
        };
        expect((0, index_1.isAssertionInverse)(assertion)).toBe(true);
    });
    it('returns false if the assertion is not inverse', () => {
        const assertion = {
            type: 'equals',
        };
        expect((0, index_1.isAssertionInverse)(assertion)).toBe(false);
    });
});
describe('getAssertionBaseType', () => {
    it('returns the base type of the non-inverse assertion', () => {
        const assertion = {
            type: 'equals',
        };
        expect((0, index_1.getAssertionBaseType)(assertion)).toBe('equals');
    });
    it('returns the base type of the inverse assertion', () => {
        const assertion = {
            type: 'not-equals',
        };
        expect((0, index_1.getAssertionBaseType)(assertion)).toBe('equals');
    });
});
//# sourceMappingURL=index.test.js.map