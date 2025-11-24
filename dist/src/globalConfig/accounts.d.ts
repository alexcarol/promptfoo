import { UserEmailStatus, BadEmailResult, EmailOkStatus } from '../types/email';
export declare function getUserId(): string;
export declare function getUserEmail(): string | null;
export declare function setUserEmail(email: string): void;
export declare function clearUserEmail(): void;
export declare function getUserEmailNeedsValidation(): boolean;
export declare function setUserEmailNeedsValidation(needsValidation: boolean): void;
export declare function getUserEmailValidated(): boolean;
export declare function setUserEmailValidated(validated: boolean): void;
export declare function getAuthor(): string | null;
export declare function isLoggedIntoCloud(): boolean;
/**
 * Get the authentication method used for cloud access
 * @returns 'api-key' | 'email' | 'none'
 */
export declare function getAuthMethod(): 'api-key' | 'email' | 'none';
interface EmailStatusResult {
    status: UserEmailStatus;
    message?: string;
    email?: string;
    hasEmail: boolean;
}
/**
 * Shared function to check email status with the promptfoo API
 * Used by both CLI and server routes
 */
export declare function checkEmailStatus(options?: {
    validate?: boolean;
}): Promise<EmailStatusResult>;
export declare function promptForEmailUnverified(): Promise<{
    emailNeedsValidation: boolean;
}>;
export declare function checkEmailStatusAndMaybeExit(options?: {
    validate?: boolean;
}): Promise<EmailOkStatus | BadEmailResult>;
export {};
//# sourceMappingURL=accounts.d.ts.map