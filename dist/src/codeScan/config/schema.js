"use strict";
/**
 * Configuration Schema
 *
 * Zod schema for validating YAML configuration files.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.ConfigSchema = void 0;
const zod_1 = require("zod");
const codeScan_1 = require("../../types/codeScan");
exports.ConfigSchema = zod_1.z
    .object({
    minSeverity: zod_1.z
        .nativeEnum(codeScan_1.CodeScanSeverity)
        .optional()
        .describe('Minimum severity level for reporting vulnerabilities'),
    minimumSeverity: zod_1.z.nativeEnum(codeScan_1.CodeScanSeverity).optional().describe('Alias for minSeverity'),
    diffsOnly: zod_1.z
        .boolean()
        .default(false)
        .describe('Only scan PR diffs, skip filesystem exploration (default: explore full repo)'),
    apiHost: zod_1.z.string().optional().describe('Scan server URL (default: https://api.promptfoo.app)'),
    guidance: zod_1.z.string().optional().describe('Custom guidance for the security scan'),
    guidanceFile: zod_1.z.string().optional().describe('Path to file containing custom guidance'),
})
    .refine((data) => !(data.guidance && data.guidanceFile), {
    message: 'Cannot specify both guidance and guidanceFile',
})
    .transform((data) => {
    // Resolve severity with precedence: minSeverity > minimumSeverity > default
    const minimumSeverity = data.minSeverity ?? data.minimumSeverity ?? codeScan_1.CodeScanSeverity.MEDIUM;
    // Remove minimumSeverity from output (it's just an alias)
    const { minimumSeverity: _, ...rest } = data;
    return {
        ...rest,
        minimumSeverity,
    };
});
exports.DEFAULT_CONFIG = {
    minimumSeverity: codeScan_1.CodeScanSeverity.MEDIUM,
    diffsOnly: false,
};
//# sourceMappingURL=schema.js.map