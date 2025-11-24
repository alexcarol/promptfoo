"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCommand = exportCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zlib_1 = __importDefault(require("zlib"));
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const eval_1 = __importDefault(require("../models/eval"));
const telemetry_1 = __importDefault(require("../telemetry"));
const index_1 = require("../util/index");
const manage_1 = require("../util/config/manage");
/**
 * Gets all log files from the logs directory, sorted by modification time (newest first)
 */
function getLogFiles(logDir) {
    if (!fs_1.default.existsSync(logDir)) {
        return [];
    }
    try {
        return fs_1.default
            .readdirSync(logDir)
            .filter((file) => file.startsWith('promptfoo-') && file.endsWith('.log'))
            .map((file) => ({
            name: file,
            path: path_1.default.join(logDir, file),
            mtime: fs_1.default.statSync(path_1.default.join(logDir, file)).mtime,
        }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by newest first
    }
    catch (error) {
        logger_1.default.error(`Error reading log directory: ${error}`);
        return [];
    }
}
/**
 * Creates a compressed tar.gz file containing log files
 */
async function createLogArchive(logFiles, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(outputPath);
        const gzip = zlib_1.default.createGzip({ level: 9 });
        output.on('close', () => {
            const stats = fs_1.default.statSync(outputPath);
            logger_1.default.info(`Created log archive: ${outputPath} (${stats.size} bytes)`);
            resolve();
        });
        output.on('error', reject);
        gzip.on('error', reject);
        gzip.pipe(output);
        for (const logFile of logFiles) {
            if (fs_1.default.existsSync(logFile)) {
                const fileName = path_1.default.basename(logFile);
                const fileContent = fs_1.default.readFileSync(logFile);
                const fileStats = fs_1.default.statSync(logFile);
                // Create tar header (simplified version)
                const header = Buffer.alloc(512);
                // File name (100 bytes)
                Buffer.from(fileName).copy(header, 0, 0, Math.min(fileName.length, 100));
                // File mode (8 bytes) - default 644
                Buffer.from('0000644 ').copy(header, 100);
                // User ID (8 bytes)
                Buffer.from('0000000 ').copy(header, 108);
                // Group ID (8 bytes)
                Buffer.from('0000000 ').copy(header, 116);
                // File size (12 bytes) - octal
                const sizeOctal = fileStats.size.toString(8).padStart(11, '0') + ' ';
                Buffer.from(sizeOctal).copy(header, 124);
                // Modification time (12 bytes) - octal
                const mtime = Math.floor(fileStats.mtime.getTime() / 1000);
                const mtimeOctal = mtime.toString(8).padStart(11, '0') + ' ';
                Buffer.from(mtimeOctal).copy(header, 136);
                // Checksum placeholder (8 bytes)
                Buffer.from('        ').copy(header, 148);
                // Type flag (1 byte) - regular file
                header[156] = 0x30; // '0'
                // Calculate checksum
                let checksum = 0;
                for (let i = 0; i < 512; i++) {
                    checksum += header[i];
                }
                const checksumOctal = checksum.toString(8).padStart(6, '0') + '\0 ';
                Buffer.from(checksumOctal).copy(header, 148);
                // Write header
                gzip.write(header);
                // Write file content
                gzip.write(fileContent);
                // Pad to 512-byte boundary
                const padding = 512 - (fileContent.length % 512);
                if (padding < 512) {
                    gzip.write(Buffer.alloc(padding));
                }
            }
        }
        // Write two empty 512-byte blocks to end the tar
        gzip.write(Buffer.alloc(1024));
        gzip.end();
    });
}
function exportCommand(program) {
    const exportCmd = program.command('export').description('Export eval records or logs');
    exportCmd
        .command('eval <evalId>')
        .description('Export an eval record to a JSON file')
        .option('-o, --output [outputPath]', 'Output path for the exported file')
        .action(async (evalId, cmdObj) => {
        try {
            let result;
            if (evalId === 'latest') {
                result = await eval_1.default.latest();
            }
            else {
                result = await eval_1.default.findById(evalId);
            }
            if (!result) {
                logger_1.default.error(`No eval found with ID ${evalId}`);
                process.exit(1);
            }
            if (cmdObj.output) {
                await (0, index_1.writeOutput)(cmdObj.output, result, null);
                logger_1.default.info(`Eval with ID ${evalId} has been successfully exported to ${cmdObj.output}.`);
            }
            else {
                const summary = await result.toEvaluateSummary();
                const metadata = (0, index_1.createOutputMetadata)(result);
                const jsonData = JSON.stringify({
                    evalId: result.id,
                    results: summary,
                    config: result.config,
                    shareableUrl: null,
                    metadata,
                }, null, 2);
                logger_1.default.info(jsonData);
            }
            telemetry_1.default.record('command_used', {
                name: 'export',
                evalId,
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to export eval: ${error}`);
            process.exit(1);
        }
    });
    exportCmd
        .command('logs')
        .description('Collect and zip log files for debugging')
        .option('-n, --count <number>', 'Number of recent log files to include (default: all)')
        .option('-o, --output [outputPath]', 'Output path for the compressed log file')
        .action(async (cmdObj) => {
        try {
            const configDir = (0, manage_1.getConfigDirectoryPath)(true);
            const logDir = (0, envars_1.getEnvString)('PROMPTFOO_LOG_DIR')
                ? path_1.default.resolve((0, envars_1.getEnvString)('PROMPTFOO_LOG_DIR'))
                : path_1.default.join(configDir, 'logs');
            if (!fs_1.default.existsSync(logDir)) {
                logger_1.default.error('No log directory found. Logs have not been created yet.');
                process.exit(1);
            }
            const allLogFiles = getLogFiles(logDir);
            if (allLogFiles.length === 0) {
                logger_1.default.error('No log files found in the logs directory.');
                process.exit(1);
            }
            // Determine how many files to include
            let logFiles = allLogFiles;
            if (cmdObj.count) {
                const count = parseInt(cmdObj.count, 10);
                if (isNaN(count) || count <= 0) {
                    logger_1.default.error('Count must be a positive number');
                    process.exit(1);
                }
                logFiles = allLogFiles.slice(0, count);
            }
            // Determine output path
            let outputPath = cmdObj.output;
            if (!outputPath) {
                const timestamp = new Date()
                    .toISOString()
                    .replace(/[:.]/g, '-')
                    .replace('T', '_')
                    .split('.')[0];
                outputPath = `promptfoo-logs-${timestamp}.gz`;
            }
            // Ensure output path has .gz extension
            if (!outputPath.endsWith('.gz')) {
                outputPath += '.gz';
            }
            logger_1.default.info(`Collecting ${logFiles.length} log file(s)...`);
            // Create the compressed archive
            await createLogArchive(logFiles.map((f) => f.path), outputPath);
            logger_1.default.info(`Log files have been collected in: ${outputPath}`);
            logger_1.default.info('You can now share this file for debugging purposes.');
            telemetry_1.default.record('command_used', {
                name: 'logs',
                fileCount: logFiles.length,
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to collect logs: ${error}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=export.js.map