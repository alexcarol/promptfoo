/**
 * Creates a standardized tool response
 */
export declare function createToolResponse(tool: string, success: boolean, data?: any, error?: string): any;
/**
 * Creates a promise that rejects after the specified timeout
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T>;
//# sourceMappingURL=utils.d.ts.map