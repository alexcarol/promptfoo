"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../src/providers/mcp/util");
describe('getAuthHeaders', () => {
    it('should return bearer auth header', () => {
        const server = {
            auth: { type: 'bearer', token: 'abc123' },
        };
        expect((0, util_1.getAuthHeaders)(server)).toEqual({
            Authorization: 'Bearer abc123',
        });
    });
    it('should return api_key auth header', () => {
        const server = {
            auth: { type: 'api_key', api_key: 'xyz789' },
        };
        expect((0, util_1.getAuthHeaders)(server)).toEqual({
            'X-API-Key': 'xyz789',
        });
    });
    it('should return empty object if no auth', () => {
        const server = {};
        expect((0, util_1.getAuthHeaders)(server)).toEqual({});
    });
    it('should return empty object for incomplete auth', () => {
        const server = { auth: { type: 'bearer' } };
        expect((0, util_1.getAuthHeaders)(server)).toEqual({});
    });
});
//# sourceMappingURL=util.test.js.map