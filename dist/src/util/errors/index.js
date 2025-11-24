"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printErrorInformation = printErrorInformation;
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const logger_1 = __importDefault(require("../../logger"));
function errorFileHasContents(filePath) {
    try {
        return (fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile() && fs_1.default.statSync(filePath).size > 0);
    }
    catch (error) {
        logger_1.default.debug(`[errorFileHasContents] Error checking if file has contents: ${filePath}`, {
            error,
        });
        return false;
    }
}
function printErrorInformation(errorLogFile, debugLogFile) {
    if (errorLogFile && errorFileHasContents(errorLogFile)) {
        logger_1.default.info(chalk_1.default.white(`\n${(0, dedent_1.default) `
        There were some errors during the operation. See logs for more details.
        Error log: ${chalk_1.default.green(errorLogFile)}
        ${debugLogFile ? `Debug log: ${chalk_1.default.green(debugLogFile)}` : ''}
      `}`));
    }
}
//# sourceMappingURL=index.js.map