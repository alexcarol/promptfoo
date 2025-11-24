import type Eval from '../models/eval';
import type { RedteamRunOptions } from './types';
export declare function doRedteamRun(options: RedteamRunOptions): Promise<Eval | undefined>;
/**
 * Custom error class for target permission-related failures.
 * Thrown when users lack necessary permissions to access or create targets.
 */
export declare class TargetPermissionError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=shared.d.ts.map