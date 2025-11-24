/**
 * Utility for parsing and validating ModelAudit CLI arguments
 * Ensures compatibility between promptfoo and modelaudit CLI interfaces
 */
import { z } from 'zod';
/**
 * Zod schema for ModelAudit CLI options
 */
export declare const ModelAuditCliOptionsSchema: z.ZodObject<{
    blacklist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    format: z.ZodOptional<z.ZodEnum<["text", "json", "sarif"]>>;
    output: z.ZodOptional<z.ZodString>;
    verbose: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    strict: z.ZodOptional<z.ZodBoolean>;
    progress: z.ZodOptional<z.ZodBoolean>;
    sbom: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    maxSize: z.ZodOptional<z.ZodString>;
    dryRun: z.ZodOptional<z.ZodBoolean>;
    cache: z.ZodOptional<z.ZodBoolean>;
    stream: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    strict?: boolean | undefined;
    output?: string | undefined;
    cache?: boolean | undefined;
    verbose?: boolean | undefined;
    quiet?: boolean | undefined;
    format?: "text" | "json" | "sarif" | undefined;
    stream?: boolean | undefined;
    timeout?: number | undefined;
    progress?: boolean | undefined;
    blacklist?: string[] | undefined;
    sbom?: string | undefined;
    maxSize?: string | undefined;
    dryRun?: boolean | undefined;
}, {
    strict?: boolean | undefined;
    output?: string | undefined;
    cache?: boolean | undefined;
    verbose?: boolean | undefined;
    quiet?: boolean | undefined;
    format?: "text" | "json" | "sarif" | undefined;
    stream?: boolean | undefined;
    timeout?: number | undefined;
    progress?: boolean | undefined;
    blacklist?: string[] | undefined;
    sbom?: string | undefined;
    maxSize?: string | undefined;
    dryRun?: boolean | undefined;
}>;
export type ModelAuditCliOptions = z.infer<typeof ModelAuditCliOptionsSchema>;
export declare const ValidatedModelAuditArgsSchema: z.ZodObject<{
    args: z.ZodArray<z.ZodString, "many">;
    unsupportedOptions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    args: string[];
    unsupportedOptions: string[];
}, {
    args: string[];
    unsupportedOptions: string[];
}>;
export type ValidatedModelAuditArgs = z.infer<typeof ValidatedModelAuditArgsSchema>;
/**
 * Valid ModelAudit CLI options as of version 0.2.5
 */
export declare const VALID_MODELAUDIT_OPTIONS: Set<string>;
/**
 * Options that were removed/changed from previous versions
 */
export declare const DEPRECATED_OPTIONS_MAP: Record<string, string | null>;
/**
 * Elegant, configuration-driven CLI argument parser
 */
export declare function parseModelAuditArgs(paths: string[], options: unknown): ValidatedModelAuditArgs;
/**
 * Validates that CLI arguments are supported by modelaudit
 */
export declare function validateModelAuditArgs(args: string[]): {
    valid: boolean;
    unsupportedArgs: string[];
};
/**
 * Suggests replacements for deprecated options
 */
export declare function suggestReplacements(deprecatedOptions: string[]): Record<string, string | null>;
/**
 * Creates a user-friendly error message for unsupported arguments
 */
export declare function formatUnsupportedArgsError(unsupportedArgs: string[]): string;
/**
 * Compact validation utilities using Zod
 */
export declare const isValidFormat: (format: unknown) => format is "text" | "json" | "sarif";
export declare const validateModelAuditOptions: (options: unknown) => ModelAuditCliOptions;
export declare const safeValidateModelAuditOptions: (options: unknown) => {
    success: true;
    data: {
        strict?: boolean | undefined;
        output?: string | undefined;
        cache?: boolean | undefined;
        verbose?: boolean | undefined;
        quiet?: boolean | undefined;
        format?: "text" | "json" | "sarif" | undefined;
        stream?: boolean | undefined;
        timeout?: number | undefined;
        progress?: boolean | undefined;
        blacklist?: string[] | undefined;
        sbom?: string | undefined;
        maxSize?: string | undefined;
        dryRun?: boolean | undefined;
    };
    error?: undefined;
} | {
    success: false;
    error: z.ZodError<{
        strict?: boolean | undefined;
        output?: string | undefined;
        cache?: boolean | undefined;
        verbose?: boolean | undefined;
        quiet?: boolean | undefined;
        format?: "text" | "json" | "sarif" | undefined;
        stream?: boolean | undefined;
        timeout?: number | undefined;
        progress?: boolean | undefined;
        blacklist?: string[] | undefined;
        sbom?: string | undefined;
        maxSize?: string | undefined;
        dryRun?: boolean | undefined;
    }>;
    data?: undefined;
};
//# sourceMappingURL=modelAuditCliParser.d.ts.map