/**
 * Configuration Schema
 *
 * Zod schema for validating YAML configuration files.
 */
import { z } from 'zod';
import { CodeScanSeverity } from '../../types/codeScan';
export declare const ConfigSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    minSeverity: z.ZodOptional<z.ZodNativeEnum<typeof CodeScanSeverity>>;
    minimumSeverity: z.ZodOptional<z.ZodNativeEnum<typeof CodeScanSeverity>>;
    diffsOnly: z.ZodDefault<z.ZodBoolean>;
    apiHost: z.ZodOptional<z.ZodString>;
    guidance: z.ZodOptional<z.ZodString>;
    guidanceFile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    diffsOnly: boolean;
    apiHost?: string | undefined;
    minimumSeverity?: CodeScanSeverity | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}, {
    apiHost?: string | undefined;
    minimumSeverity?: CodeScanSeverity | undefined;
    diffsOnly?: boolean | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}>, {
    diffsOnly: boolean;
    apiHost?: string | undefined;
    minimumSeverity?: CodeScanSeverity | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}, {
    apiHost?: string | undefined;
    minimumSeverity?: CodeScanSeverity | undefined;
    diffsOnly?: boolean | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}>, {
    minimumSeverity: CodeScanSeverity;
    diffsOnly: boolean;
    apiHost?: string | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}, {
    apiHost?: string | undefined;
    minimumSeverity?: CodeScanSeverity | undefined;
    diffsOnly?: boolean | undefined;
    guidance?: string | undefined;
    minSeverity?: CodeScanSeverity | undefined;
    guidanceFile?: string | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const DEFAULT_CONFIG: Config;
//# sourceMappingURL=schema.d.ts.map