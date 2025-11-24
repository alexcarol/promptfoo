"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidReusablePolicyId = isValidReusablePolicyId;
exports.isValidInlinePolicyId = isValidInlinePolicyId;
exports.isValidPolicyId = isValidPolicyId;
/**
 * @fileoverview This module contains pure validation functions – those without external dependencies
 * e.g. `PolicyObjectSchema` (which would otherwise introduce circular dependencies).
 *
 * TODO:
 *
 * - PolicyObjectSchema could be moved into this module along w/ `isPolicyMetric` and `isValidPolicyObject`,
 * to co-locate all of the policy validation logic.
 */
const uuid_1 = require("uuid");
/**
 * Checks whether a policy ID is a valid reusable policy ID.
 * @param id - The policy ID to check.
 * @returns True if the policy ID is a valid reusable policy ID, false otherwise.
 */
function isValidReusablePolicyId(id) {
    return (0, uuid_1.validate)(id);
}
/**
 * Checks whether a policy ID is a valid inline policy ID.
 * @param id - The policy ID to check.
 * @returns True if the policy ID is a valid inline policy ID, false otherwise.
 */
function isValidInlinePolicyId(id) {
    return /^[0-9a-f]{12}$/i.test(id);
}
/**
 * Checks whether a policy ID is a valid policy ID.
 * @param id - The policy ID to check.
 * @returns True if the policy ID is a valid policy ID, false otherwise.
 */
function isValidPolicyId(id) {
    return isValidReusablePolicyId(id) || isValidInlinePolicyId(id);
}
//# sourceMappingURL=validators.js.map