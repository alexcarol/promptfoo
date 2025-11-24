import { type Policy, PolicyObject } from '../../types';
/**
 * Checks if a metric is a policy metric.
 * @param metric - The metric to check.
 * @returns True if the metric is a policy metric, false otherwise.
 */
export declare function isPolicyMetric(metric: string): boolean;
/**
 * Deserializes a policy ID from a metric.
 * @param metric - The metric to deserialize.
 * @returns The policy ID.
 */
export declare function deserializePolicyIdFromMetric(metric: string): PolicyObject['id'];
/**
 * Formats a policy identifier as a metric.
 * @param identifier Either the reusable policy's name or the inline policy's content hash.
 * @param originalMetric - An optional original metric string to extract the strategy suffix from.
 * @returns The formatted policy identifier.
 */
export declare function formatPolicyIdentifierAsMetric(identifier: string, originalMetric?: string): string;
/**
 * Makes a URL to a custom policy in the cloud.
 * @param cloudAppUrl - The URL of the cloud app.
 * @param policyId - The ID of the policy.
 * @returns The URL to the custom policy in the cloud.
 */
export declare function makeCustomPolicyCloudUrl(cloudAppUrl: string, policyId: string): string;
/**
 * Parses the policy id to determine if it's a reusable or inline policy. Reusable policies use
 * v4 UUIDs whereas inline policies use a hash of the policy text.
 * @param policyId – A PolicyObject.id value.
 * @returns 'reusable' if the policy is a reusable policy, 'inline' if the policy is an inline policy.
 */
export declare function determinePolicyTypeFromId(policyId: string): 'reusable' | 'inline';
/**
 * Checks whether a given Policy is a valid PolicyObject.
 * @param policy - The policy to check.
 * @returns True if the policy is a valid PolicyObject, false otherwise.
 */
export declare function isValidPolicyObject(policy: Policy): policy is PolicyObject;
/**
 * Constructs a unique ID for the inline policy by hashing the policy text and
 * taking the first 12 characters of the hash.
 * @param policyText - The text of the policy.
 * @returns The ID for the inline policy.
 */
export declare function makeInlinePolicyId(policyText: string): string;
/**
 * Creates a default name for a (legacy) text-only inline custom policy.
 */
export declare function makeDefaultPolicyName(index: number): string;
//# sourceMappingURL=utils.d.ts.map