import type { Command } from 'commander';
import type { UnifiedConfig } from '../types/index';
interface ValidateOptions {
    config?: string[];
    envPath?: string;
}
interface ValidateTargetOptions {
    target?: string;
    config?: string;
    envPath?: string;
}
export declare function doValidate(opts: ValidateOptions, defaultConfig: Partial<UnifiedConfig>, defaultConfigPath: string | undefined): Promise<void>;
/**
 * Validate a specific target (provider)
 */
export declare function doValidateTarget(opts: ValidateTargetOptions, defaultConfig: Partial<UnifiedConfig>): Promise<void>;
export declare function validateCommand(program: Command, defaultConfig: Partial<UnifiedConfig>, defaultConfigPath: string | undefined): void;
export {};
//# sourceMappingURL=validate.d.ts.map