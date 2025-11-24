"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const validators_1 = require("./validators");
// Mock dependencies
jest.mock('uuid', () => ({
    validate: jest.fn(),
}));
jest.mock('../../../util/createHash', () => ({
    sha256: jest.fn(),
}));
describe('Policy Validators', () => {
    describe('isValidReusablePolicyId', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should return true for valid UUIDs', () => {
            uuid_1.validate.mockReturnValue(true);
            expect((0, validators_1.isValidReusablePolicyId)('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
            expect(uuid_1.validate).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
        });
        it('should return false for invalid UUIDs', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidReusablePolicyId)('not-a-uuid')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('abcdef123456')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('')).toBe(false);
        });
        it('should return false for inline policy IDs', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidReusablePolicyId)('abcdef123456')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('123456789abc')).toBe(false);
        });
        it('should handle various invalid formats', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidReusablePolicyId)('550e8400')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('550e8400-e29b-41d4')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('not-valid-at-all')).toBe(false);
            expect((0, validators_1.isValidReusablePolicyId)('123')).toBe(false);
        });
    });
    describe('isValidInlinePolicyId', () => {
        it('should return true for valid 12-character hex strings', () => {
            expect((0, validators_1.isValidInlinePolicyId)('abcdef123456')).toBe(true);
            expect((0, validators_1.isValidInlinePolicyId)('123456789abc')).toBe(true);
            expect((0, validators_1.isValidInlinePolicyId)('0123456789ab')).toBe(true);
            expect((0, validators_1.isValidInlinePolicyId)('fedcba987654')).toBe(true);
        });
        it('should be case insensitive', () => {
            expect((0, validators_1.isValidInlinePolicyId)('ABCDEF123456')).toBe(true);
            expect((0, validators_1.isValidInlinePolicyId)('AbCdEf123456')).toBe(true);
            expect((0, validators_1.isValidInlinePolicyId)('aBcDeF123456')).toBe(true);
        });
        it('should return false for strings that are not 12 characters', () => {
            expect((0, validators_1.isValidInlinePolicyId)('abcdef12345')).toBe(false); // 11 chars
            expect((0, validators_1.isValidInlinePolicyId)('abcdef1234567')).toBe(false); // 13 chars
            expect((0, validators_1.isValidInlinePolicyId)('abc')).toBe(false); // 3 chars
            expect((0, validators_1.isValidInlinePolicyId)('')).toBe(false); // 0 chars
        });
        it('should return false for non-hex characters', () => {
            expect((0, validators_1.isValidInlinePolicyId)('ghijkl123456')).toBe(false); // contains g-l
            expect((0, validators_1.isValidInlinePolicyId)('abcdef12345z')).toBe(false); // contains z
            expect((0, validators_1.isValidInlinePolicyId)('abcdef-12345')).toBe(false); // contains dash
            expect((0, validators_1.isValidInlinePolicyId)('abcdef 12345')).toBe(false); // contains space
        });
        it('should return false for UUIDs', () => {
            expect((0, validators_1.isValidInlinePolicyId)('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
            expect((0, validators_1.isValidInlinePolicyId)('550e8400e29b41d4a716446655440000')).toBe(false);
        });
        it('should return false for special characters', () => {
            expect((0, validators_1.isValidInlinePolicyId)('abcdef12345!')).toBe(false);
            expect((0, validators_1.isValidInlinePolicyId)('abcdef12345@')).toBe(false);
            expect((0, validators_1.isValidInlinePolicyId)('abcdef12345#')).toBe(false);
        });
    });
    describe('isValidPolicyId', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should return true for valid reusable policy IDs (UUIDs)', () => {
            uuid_1.validate.mockReturnValue(true);
            expect((0, validators_1.isValidPolicyId)('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
            expect((0, validators_1.isValidPolicyId)('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        });
        it('should return true for valid inline policy IDs (12-char hex)', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidPolicyId)('abcdef123456')).toBe(true);
            expect((0, validators_1.isValidPolicyId)('123456789abc')).toBe(true);
            expect((0, validators_1.isValidPolicyId)('FEDCBA987654')).toBe(true);
        });
        it('should return false for invalid policy IDs', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidPolicyId)('not-a-valid-id')).toBe(false);
            expect((0, validators_1.isValidPolicyId)('abc')).toBe(false);
            expect((0, validators_1.isValidPolicyId)('')).toBe(false);
            expect((0, validators_1.isValidPolicyId)('550e8400')).toBe(false);
        });
        it('should return false for strings that are neither UUID nor 12-char hex', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidPolicyId)('abcdef12345')).toBe(false); // 11 chars
            expect((0, validators_1.isValidPolicyId)('abcdef1234567')).toBe(false); // 13 chars
            expect((0, validators_1.isValidPolicyId)('ghijkl123456')).toBe(false); // non-hex chars
            expect((0, validators_1.isValidPolicyId)('abcdef-12345')).toBe(false); // contains dash
        });
        it('should handle edge cases', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, validators_1.isValidPolicyId)('000000000000')).toBe(true); // All zeros is valid hex
            expect((0, validators_1.isValidPolicyId)('ffffffffffff')).toBe(true); // All f's is valid hex
            expect((0, validators_1.isValidPolicyId)('123')).toBe(false); // Too short
        });
    });
});
//# sourceMappingURL=validators.test.js.map