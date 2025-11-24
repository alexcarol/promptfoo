/**
 * Generic utility functions for sanitizing objects to prevent logging of secrets and credentials
 * Uses a custom recursive approach for reliable deep object sanitization.
 */
/**
 * Generic function to sanitize any object by removing or redacting sensitive information
 * @param obj - The object to sanitize
 * @param options - Optional configuration
 * @returns A sanitized copy of the object with secrets redacted
 */
export declare function sanitizeObject(obj: any, options?: {
    context?: string;
    throwOnError?: boolean;
}): any;
export declare const sanitizeBody: typeof sanitizeObject;
export declare const sanitizeHeaders: typeof sanitizeObject;
export declare const sanitizeQueryParams: typeof sanitizeObject;
export declare function sanitizeUrl(url: string): string;
//# sourceMappingURL=sanitizer.d.ts.map