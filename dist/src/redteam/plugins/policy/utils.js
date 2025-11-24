"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPolicyMetric = isPolicyMetric;
exports.deserializePolicyIdFromMetric = deserializePolicyIdFromMetric;
exports.formatPolicyIdentifierAsMetric = formatPolicyIdentifierAsMetric;
exports.makeCustomPolicyCloudUrl = makeCustomPolicyCloudUrl;
exports.determinePolicyTypeFromId = determinePolicyTypeFromId;
exports.isValidPolicyObject = isValidPolicyObject;
exports.makeInlinePolicyId = makeInlinePolicyId;
exports.makeDefaultPolicyName = makeDefaultPolicyName;
const createHash_1 = require("../../../util/createHash");
const types_1 = require("../../types");
const constants_1 = require("./constants");
const validators_1 = require("./validators");
const invariant_1 = __importDefault(require("../../../util/invariant"));
/**
 * Checks if a metric is a policy metric.
 * @param metric - The metric to check.
 * @returns True if the metric is a policy metric, false otherwise.
 */
function isPolicyMetric(metric) {
    return metric.startsWith(constants_1.POLICY_METRIC_PREFIX);
}
/**
 * Deserializes a policy ID from a metric.
 * @param metric - The metric to deserialize.
 * @returns The policy ID.
 */
function deserializePolicyIdFromMetric(metric) {
    return (metric
        // Remove the metric prefix
        .replace(`${constants_1.POLICY_METRIC_PREFIX}:`, '')
        // If the metric contains a strategy suffix, remove it
        .split('/')[0]);
}
/**
 * Formats a policy identifier as a metric.
 * @param identifier Either the reusable policy's name or the inline policy's content hash.
 * @param originalMetric - An optional original metric string to extract the strategy suffix from.
 * @returns The formatted policy identifier.
 */
function formatPolicyIdentifierAsMetric(identifier, originalMetric) {
    // If the original metric contains a strategy suffix, persist it in the formatted metric
    let suffix;
    if (originalMetric) {
        (0, invariant_1.default)(originalMetric.startsWith(`${constants_1.POLICY_METRIC_PREFIX}:`), 'Invalid original metric');
        if (originalMetric?.includes('/')) {
            suffix = originalMetric?.split('/')[1];
        }
    }
    // Use the plugin/strategy format found elsewhere in the codebase
    return `Policy${suffix ? `/${suffix}` : ''}: ${identifier}`;
}
/**
 * Makes a URL to a custom policy in the cloud.
 * @param cloudAppUrl - The URL of the cloud app.
 * @param policyId - The ID of the policy.
 * @returns The URL to the custom policy in the cloud.
 */
function makeCustomPolicyCloudUrl(cloudAppUrl, policyId) {
    return `${cloudAppUrl}/redteam/plugins/policies/${policyId}`;
}
/**
 * Parses the policy id to determine if it's a reusable or inline policy. Reusable policies use
 * v4 UUIDs whereas inline policies use a hash of the policy text.
 * @param policyId – A PolicyObject.id value.
 * @returns 'reusable' if the policy is a reusable policy, 'inline' if the policy is an inline policy.
 */
function determinePolicyTypeFromId(policyId) {
    return (0, validators_1.isValidReusablePolicyId)(policyId) ? 'reusable' : 'inline';
}
/**
 * Checks whether a given Policy is a valid PolicyObject.
 * @param policy - The policy to check.
 * @returns True if the policy is a valid PolicyObject, false otherwise.
 */
function isValidPolicyObject(policy) {
    return types_1.PolicyObjectSchema.safeParse(policy).success;
}
/**
 * Constructs a unique ID for the inline policy by hashing the policy text and
 * taking the first 12 characters of the hash.
 * @param policyText - The text of the policy.
 * @returns The ID for the inline policy.
 */
function makeInlinePolicyId(policyText) {
    return (0, createHash_1.sha256)(policyText).slice(0, 
    // 0.18% chance of collision w/ 1M policies i.e. extremely unlikely
    12);
}
/**
 * Creates a default name for a (legacy) text-only inline custom policy.
 */
function makeDefaultPolicyName(index) {
    return `Custom Policy ${index + 1}`;
}
//# sourceMappingURL=utils.js.map