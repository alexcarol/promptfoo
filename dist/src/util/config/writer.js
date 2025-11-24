"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePromptfooConfig = writePromptfooConfig;
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = __importDefault(require("../../logger"));
const json_1 = require("../json");
function writePromptfooConfig(config, outputPath, headerComments) {
    const orderedConfig = (0, json_1.orderKeys)(config, [
        'description',
        'targets',
        'prompts',
        'providers',
        'redteam',
        'defaultTest',
        'tests',
        'scenarios',
    ]);
    const yamlContent = js_yaml_1.default.dump(orderedConfig, { skipInvalid: true });
    if (!yamlContent) {
        logger_1.default.warn('Warning: config is empty, skipping write');
        return orderedConfig;
    }
    const schemaComment = `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json`;
    const headerCommentLines = headerComments
        ? headerComments.map((comment) => `# ${comment}`).join('\n') + '\n'
        : '';
    fs_1.default.writeFileSync(outputPath, `${schemaComment}\n${headerCommentLines}${yamlContent}`);
    return orderedConfig;
}
//# sourceMappingURL=writer.js.map