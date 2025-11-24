"use strict";
/**
 * Configuration Loader Tests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const loader_1 = require("../../../src/codeScan/config/loader");
const codeScan_1 = require("../../../src/types/codeScan");
describe('Configuration Loader', () => {
    let tempDir;
    beforeEach(() => {
        // Create a temporary directory for test files
        tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'code-scan-test-'));
    });
    afterEach(() => {
        // Clean up temporary directory
        if (fs_1.default.existsSync(tempDir)) {
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    describe('loadConfig', () => {
        it('should load valid configuration file', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: high\ndiffsOnly: false');
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config).toEqual({
                minimumSeverity: codeScan_1.CodeScanSeverity.HIGH,
                diffsOnly: false,
            });
        });
        it('should apply defaults for missing optional fields', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, '{}'); // Empty object
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config).toEqual({
                minimumSeverity: codeScan_1.CodeScanSeverity.MEDIUM,
                diffsOnly: false,
            });
        });
        it('should accept all valid severity levels', () => {
            const testCases = [
                [codeScan_1.CodeScanSeverity.LOW, 'low'],
                [codeScan_1.CodeScanSeverity.MEDIUM, 'medium'],
                [codeScan_1.CodeScanSeverity.HIGH, 'high'],
                [codeScan_1.CodeScanSeverity.CRITICAL, 'critical'],
            ];
            for (const [expectedLevel, levelString] of testCases) {
                const configPath = path_1.default.join(tempDir, `config-${levelString}.yaml`);
                fs_1.default.writeFileSync(configPath, `minimumSeverity: ${levelString}\ndiffsOnly: true`);
                const config = (0, loader_1.loadConfig)(configPath);
                expect(config.minimumSeverity).toBe(expectedLevel);
                expect(config.diffsOnly).toBe(true);
            }
        });
        it('should throw ConfigLoadError if file does not exist', () => {
            const nonExistentPath = path_1.default.join(tempDir, 'does-not-exist.yaml');
            expect(() => (0, loader_1.loadConfig)(nonExistentPath)).toThrow(codeScan_1.ConfigLoadError);
            expect(() => (0, loader_1.loadConfig)(nonExistentPath)).toThrow('Configuration file not found');
        });
        it('should throw ConfigLoadError if file cannot be parsed', () => {
            const configPath = path_1.default.join(tempDir, 'invalid.yaml');
            fs_1.default.writeFileSync(configPath, '{ invalid yaml content [[[');
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(codeScan_1.ConfigLoadError);
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow('Failed to parse YAML');
        });
        it('should throw ConfigLoadError if validation fails', () => {
            const configPath = path_1.default.join(tempDir, 'invalid-schema.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: invalid-level\ndiffsOnly: not-a-boolean');
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(codeScan_1.ConfigLoadError);
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow('Invalid configuration');
        });
        it('should handle boolean diffsOnly values', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: medium\ndiffsOnly: true');
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config.diffsOnly).toBe(true);
        });
        it('should accept minSeverity as an alias for minimumSeverity', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minSeverity: critical\ndiffsOnly: true');
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config.minimumSeverity).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect(config.diffsOnly).toBe(true);
        });
        it('should prefer minSeverity over minimumSeverity when both provided', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minSeverity: low\nminimumSeverity: high\ndiffsOnly: false');
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config.minimumSeverity).toBe(codeScan_1.CodeScanSeverity.LOW);
            expect(config.diffsOnly).toBe(false);
        });
        it('should accept all valid severity levels with minSeverity alias', () => {
            const testCases = [
                [codeScan_1.CodeScanSeverity.LOW, 'low'],
                [codeScan_1.CodeScanSeverity.MEDIUM, 'medium'],
                [codeScan_1.CodeScanSeverity.HIGH, 'high'],
                [codeScan_1.CodeScanSeverity.CRITICAL, 'critical'],
            ];
            for (const [expectedLevel, levelString] of testCases) {
                const configPath = path_1.default.join(tempDir, `config-min-${levelString}.yaml`);
                fs_1.default.writeFileSync(configPath, `minSeverity: ${levelString}\ndiffsOnly: true`);
                const config = (0, loader_1.loadConfig)(configPath);
                expect(config.minimumSeverity).toBe(expectedLevel);
                expect(config.diffsOnly).toBe(true);
            }
        });
        it('should accept inline guidance text', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: high\nguidance: "Focus on authentication vulnerabilities"');
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config.guidance).toBe('Focus on authentication vulnerabilities');
        });
        it('should read guidanceFile and populate guidance field', () => {
            const guidanceFilePath = path_1.default.join(tempDir, 'guidance.txt');
            fs_1.default.writeFileSync(guidanceFilePath, 'Focus on authentication vulnerabilities');
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, `minimumSeverity: high\nguidanceFile: ${guidanceFilePath}`);
            const config = (0, loader_1.loadConfig)(configPath);
            expect(config.guidance).toBe('Focus on authentication vulnerabilities');
        });
        it('should throw ConfigLoadError when guidanceFile does not exist', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: high\nguidanceFile: ./nonexistent.txt');
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(codeScan_1.ConfigLoadError);
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(/Failed to read guidance file/);
        });
        it('should throw ConfigLoadError when both guidance and guidanceFile are specified', () => {
            const guidanceFilePath = path_1.default.join(tempDir, 'guidance.txt');
            fs_1.default.writeFileSync(guidanceFilePath, 'File guidance');
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, `minimumSeverity: high\nguidance: "Inline guidance"\nguidanceFile: ${guidanceFilePath}`);
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(codeScan_1.ConfigLoadError);
            expect(() => (0, loader_1.loadConfig)(configPath)).toThrow(/Cannot specify both guidance and guidanceFile/);
        });
    });
    describe('loadConfigOrDefault', () => {
        it('should return default config when no path provided', () => {
            const config = (0, loader_1.loadConfigOrDefault)();
            expect(config).toEqual({
                minimumSeverity: codeScan_1.CodeScanSeverity.MEDIUM,
                diffsOnly: false,
            });
        });
        it('should load config when path provided', () => {
            const configPath = path_1.default.join(tempDir, 'config.yaml');
            fs_1.default.writeFileSync(configPath, 'minimumSeverity: critical\ndiffsOnly: true');
            const config = (0, loader_1.loadConfigOrDefault)(configPath);
            expect(config).toEqual({
                minimumSeverity: codeScan_1.CodeScanSeverity.CRITICAL,
                diffsOnly: true,
            });
        });
        it('should return default config when empty string provided', () => {
            const config = (0, loader_1.loadConfigOrDefault)('');
            expect(config).toEqual({
                minimumSeverity: codeScan_1.CodeScanSeverity.MEDIUM,
                diffsOnly: false,
            });
        });
    });
});
//# sourceMappingURL=loader.test.js.map