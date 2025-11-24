"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const createHash_1 = require("../../../util/createHash");
const types_1 = require("../../types");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const uuid_2 = require("uuid");
// Mock dependencies
jest.mock('uuid', () => ({
    validate: jest.fn(),
    v4: jest.fn(),
}));
jest.mock('../../../util/createHash', () => ({
    sha256: jest.fn(),
}));
describe('Policy Utils', () => {
    describe('isPolicyMetric', () => {
        it('should return true for metrics that start with POLICY_METRIC_PREFIX', () => {
            expect((0, utils_1.isPolicyMetric)(`${constants_1.POLICY_METRIC_PREFIX}:test`)).toBe(true);
            expect((0, utils_1.isPolicyMetric)(`${constants_1.POLICY_METRIC_PREFIX}`)).toBe(true);
            expect((0, utils_1.isPolicyMetric)(`${constants_1.POLICY_METRIC_PREFIX}:{"id":"123"}`)).toBe(true);
        });
        it('should return false for metrics that do not start with POLICY_METRIC_PREFIX', () => {
            expect((0, utils_1.isPolicyMetric)('test:policy')).toBe(false);
            expect((0, utils_1.isPolicyMetric)('other')).toBe(false);
            expect((0, utils_1.isPolicyMetric)('')).toBe(false);
            expect((0, utils_1.isPolicyMetric)('Policy')).toBe(false);
        });
    });
    describe('deserializePolicyIdFromMetric', () => {
        it('should deserialize a policy ID from a metric without strategy suffix', () => {
            const result = (0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:test-id`);
            expect(result).toBe('test-id');
        });
        it('should deserialize a policy ID and remove strategy suffix', () => {
            const mockUuid = '550e8400-e29b-41d4-a716-446655440000';
            uuid_2.v4.mockReturnValue(mockUuid);
            const result = (0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:${mockUuid}/jailbreak`);
            expect(result).toBe(mockUuid);
        });
        it('should handle multiple strategy suffixes', () => {
            const mockUuid = '550e8400-e29b-41d4-a716-446655440000';
            uuid_2.v4.mockReturnValue(mockUuid);
            const result = (0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:${mockUuid}/jailbreak/extra`);
            expect(result).toBe(mockUuid);
        });
        it('should handle various strategy names', () => {
            expect((0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:policy-id/GOAT`)).toBe('policy-id');
            expect((0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:policy-id/prompt-injection`)).toBe('policy-id');
            expect((0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:abcdef123456/harmful-content`)).toBe('abcdef123456');
        });
        it('should handle inline policy IDs with strategy suffix', () => {
            const inlineId = 'abcdef123456';
            const result = (0, utils_1.deserializePolicyIdFromMetric)(`${constants_1.POLICY_METRIC_PREFIX}:${inlineId}/jailbreak`);
            expect(result).toBe(inlineId);
        });
    });
    describe('formatPolicyIdentifierAsMetric', () => {
        it('should format a policy identifier correctly without originalMetric', () => {
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('test-policy')).toBe('Policy: test-policy');
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('123')).toBe('Policy: 123');
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('')).toBe('Policy: ');
        });
        it('should handle identifiers with special characters', () => {
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('policy-with-dashes')).toBe('Policy: policy-with-dashes');
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('policy_with_underscores')).toBe('Policy: policy_with_underscores');
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('policy.with.dots')).toBe('Policy: policy.with.dots');
        });
        it('should preserve strategy suffix from originalMetric', () => {
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('test-policy', `PolicyViolation:${(0, uuid_2.v4)()}/jailbreak`)).toBe('Policy/jailbreak: test-policy');
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('my-policy', `PolicyViolation:${(0, uuid_2.v4)()}/GOAT`)).toBe('Policy/GOAT: my-policy');
        });
        it('should handle empty originalMetric', () => {
            expect((0, utils_1.formatPolicyIdentifierAsMetric)('test-policy', '')).toBe('Policy: test-policy');
        });
    });
    describe('makeCustomPolicyCloudUrl', () => {
        it('should create a valid cloud URL', () => {
            const result = (0, utils_1.makeCustomPolicyCloudUrl)('https://cloud.example.com', 'policy-123');
            expect(result).toBe('https://cloud.example.com/redteam/plugins/policies/policy-123');
        });
        it('should handle URLs with trailing slash', () => {
            const result = (0, utils_1.makeCustomPolicyCloudUrl)('https://cloud.example.com/', 'policy-456');
            expect(result).toBe('https://cloud.example.com//redteam/plugins/policies/policy-456');
        });
        it('should handle various policy ID formats', () => {
            expect((0, utils_1.makeCustomPolicyCloudUrl)('https://app.com', 'uuid-123-456')).toBe('https://app.com/redteam/plugins/policies/uuid-123-456');
            expect((0, utils_1.makeCustomPolicyCloudUrl)('https://app.com', 'hash12345678')).toBe('https://app.com/redteam/plugins/policies/hash12345678');
        });
        it('should handle empty strings', () => {
            expect((0, utils_1.makeCustomPolicyCloudUrl)('', 'policy-id')).toBe('/redteam/plugins/policies/policy-id');
            expect((0, utils_1.makeCustomPolicyCloudUrl)('https://app.com', '')).toBe('https://app.com/redteam/plugins/policies/');
        });
    });
    describe('determinePolicyTypeFromId', () => {
        it('should return "reusable" for valid UUIDs', () => {
            uuid_1.validate.mockReturnValue(true);
            expect((0, utils_1.determinePolicyTypeFromId)('550e8400-e29b-41d4-a716-446655440000')).toBe('reusable');
            expect(uuid_1.validate).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
        });
        it('should return "inline" for non-UUID strings', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, utils_1.determinePolicyTypeFromId)('hash123456')).toBe('inline');
            expect((0, utils_1.determinePolicyTypeFromId)('not-a-uuid')).toBe('inline');
            expect((0, utils_1.determinePolicyTypeFromId)('')).toBe('inline');
        });
        it('should handle edge cases', () => {
            uuid_1.validate.mockReturnValue(false);
            expect((0, utils_1.determinePolicyTypeFromId)('123')).toBe('inline');
            expect((0, utils_1.determinePolicyTypeFromId)('550e8400')).toBe('inline');
        });
    });
    describe('isValidPolicyObject', () => {
        // Mock the PolicyObjectSchema.safeParse method
        const mockSafeParse = jest.spyOn(types_1.PolicyObjectSchema, 'safeParse');
        it('should return true for valid PolicyObject', () => {
            mockSafeParse.mockReturnValueOnce({ success: true, data: {} });
            const policy = {
                id: 'test-id',
                name: 'Test Policy',
                text: 'Policy text',
            };
            expect((0, utils_1.isValidPolicyObject)(policy)).toBe(true);
            expect(mockSafeParse).toHaveBeenCalledWith(policy);
        });
        it('should return false for invalid PolicyObject', () => {
            mockSafeParse.mockReturnValueOnce({ success: false, error: {} });
            const invalidPolicy = {
                invalid: 'field',
            };
            expect((0, utils_1.isValidPolicyObject)(invalidPolicy)).toBe(false);
            expect(mockSafeParse).toHaveBeenCalledWith(invalidPolicy);
        });
        it('should return false for string policy', () => {
            mockSafeParse.mockReturnValueOnce({ success: false, error: {} });
            const stringPolicy = 'This is a string policy';
            expect((0, utils_1.isValidPolicyObject)(stringPolicy)).toBe(false);
            expect(mockSafeParse).toHaveBeenCalledWith(stringPolicy);
        });
        it('should handle null and undefined', () => {
            mockSafeParse.mockReturnValueOnce({ success: false, error: {} });
            expect((0, utils_1.isValidPolicyObject)(null)).toBe(false);
            mockSafeParse.mockReturnValueOnce({ success: false, error: {} });
            expect((0, utils_1.isValidPolicyObject)(undefined)).toBe(false);
        });
    });
    describe('makeInlinePolicyId', () => {
        it('should create a 12-character ID from policy text', () => {
            createHash_1.sha256.mockReturnValue('abcdef1234567890abcdef1234567890');
            const result = (0, utils_1.makeInlinePolicyId)('This is my policy text');
            expect(result).toBe('abcdef123456');
            expect(result).toHaveLength(12);
            expect(createHash_1.sha256).toHaveBeenCalledWith('This is my policy text');
        });
        it('should create consistent IDs for the same text', () => {
            createHash_1.sha256.mockReturnValue('1234567890abcdef1234567890abcdef');
            const text = 'Same policy text';
            const id1 = (0, utils_1.makeInlinePolicyId)(text);
            const id2 = (0, utils_1.makeInlinePolicyId)(text);
            expect(id1).toBe(id2);
            expect(id1).toBe('1234567890ab');
        });
        it('should create different IDs for different text', () => {
            createHash_1.sha256
                .mockReturnValueOnce('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                .mockReturnValueOnce('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
            const id1 = (0, utils_1.makeInlinePolicyId)('Policy A');
            const id2 = (0, utils_1.makeInlinePolicyId)('Policy B');
            expect(id1).toBe('aaaaaaaaaaaa');
            expect(id2).toBe('bbbbbbbbbbbb');
            expect(id1).not.toBe(id2);
        });
        it('should handle empty strings', () => {
            createHash_1.sha256.mockReturnValue('emptyhashabcd1234567890abcdef');
            const result = (0, utils_1.makeInlinePolicyId)('');
            expect(result).toBe('emptyhashabc');
            expect(createHash_1.sha256).toHaveBeenCalledWith('');
        });
        it('should handle special characters and multiline text', () => {
            createHash_1.sha256.mockReturnValue('specialhash1234567890abcdef');
            const text = `Line 1
Line 2
Special chars: !@#$%^&*()
Unicode: 你好 🎉`;
            const result = (0, utils_1.makeInlinePolicyId)(text);
            expect(result).toBe('specialhash1');
            expect(createHash_1.sha256).toHaveBeenCalledWith(text);
        });
        it('should always return 12 characters even if hash is shorter', () => {
            createHash_1.sha256.mockReturnValue('short');
            const result = (0, utils_1.makeInlinePolicyId)('Short hash text');
            expect(result).toBe('short');
            expect(result.length).toBeLessThanOrEqual(12);
        });
    });
});
//# sourceMappingURL=utils.test.js.map