import type Eval from './models/eval';
import type ModelAudit from './models/modelAudit';
interface ShareDomainResult {
    domain: string;
    isPublicShare: boolean;
}
export declare function isSharingEnabled(evalRecord: Eval): boolean;
export declare function isModelAuditSharingEnabled(): boolean;
export declare function determineShareDomain(eval_: Eval): ShareDomainResult;
/**
 * Removes authentication information (username and password) from a URL.
 *
 * This function addresses a security concern raised in GitHub issue #1184,
 * where sensitive authentication information was being displayed in the CLI output.
 * By default, we now strip this information to prevent accidental exposure of credentials.
 *
 * @param urlString - The URL string that may contain authentication information.
 * @returns A new URL string with username and password removed, if present.
 *          If URL parsing fails, it returns the original string.
 */
export declare function stripAuthFromUrl(urlString: string): string;
/**
 * Constructs the shareable URL for an eval.
 * @param eval_ The eval to get the shareable URL for.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the eval.
 */
export declare function getShareableUrl(eval_: Eval, remoteEvalId: string, showAuth?: boolean): Promise<string | null>;
/**
 * Shares an eval and returns the shareable URL.
 * @param evalRecord The eval to share.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the eval.
 */
export declare function createShareableUrl(evalRecord: Eval, showAuth?: boolean): Promise<string | null>;
/**
 * Checks whether an eval has been shared.
 * @param eval_ The eval to check.
 * @returns True if the eval has been shared, false otherwise.
 */
export declare function hasEvalBeenShared(eval_: Eval): Promise<boolean>;
/**
 * Checks whether a model audit has been shared.
 * @param audit The model audit to check.
 * @returns True if the model audit has been shared, false otherwise.
 */
export declare function hasModelAuditBeenShared(audit: ModelAudit): Promise<boolean>;
/**
 * Creates a shareable URL for a model audit.
 * @param auditRecord The model audit to share.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the model audit.
 */
export declare function createShareableModelAuditUrl(auditRecord: ModelAudit, showAuth?: boolean): Promise<string | null>;
/**
 * Gets the shareable URL for a model audit.
 * @param audit The model audit.
 * @param remoteAuditId The remote ID of the model audit.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the model audit.
 */
export declare function getShareableModelAuditUrl(_audit: ModelAudit, remoteAuditId: string, showAuth?: boolean): string;
export {};
//# sourceMappingURL=share.d.ts.map