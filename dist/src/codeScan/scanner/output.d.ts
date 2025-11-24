/**
 * Output Formatting and Display
 *
 * Handles formatting and displaying scan results in various formats (JSON, pretty-print).
 */
import ora from 'ora';
import { type ScanResponse } from '../../types/codeScan';
/**
 * Options for output display
 */
export interface OutputOptions {
    json: boolean;
    githubPr?: string;
}
/**
 * Options for spinner creation
 */
export interface SpinnerOptions {
    json: boolean;
    isWebUI: boolean;
    logLevel: string;
}
/**
 * Create spinner if appropriate for the current environment
 *
 * @param options - Options for spinner creation
 * @returns Spinner instance or undefined if spinner should not be shown
 */
export declare function createSpinner(options: SpinnerOptions): ReturnType<typeof ora> | undefined;
/**
 * Display scan results in the appropriate format
 *
 * @param response - Scan response from server
 * @param duration - Duration of scan in milliseconds
 * @param options - Output options
 */
export declare function displayScanResults(response: ScanResponse, duration: number, options: OutputOptions): void;
//# sourceMappingURL=output.d.ts.map