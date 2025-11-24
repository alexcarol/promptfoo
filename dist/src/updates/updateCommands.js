"use strict";
/**
 * Shared logic for generating update commands based on environment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdateCommands = getUpdateCommands;
exports.getUpdateCommandLabel = getUpdateCommandLabel;
function getUpdateCommands(options) {
    const { selfHosted, isNpx } = options;
    if (selfHosted) {
        return {
            primary: 'docker pull promptfoo/promptfoo:latest',
            alternative: null,
            commandType: 'docker',
        };
    }
    return {
        primary: isNpx ? 'npx promptfoo@latest' : 'npm install -g promptfoo@latest',
        alternative: isNpx ? 'npm install -g promptfoo@latest' : 'npx promptfoo@latest',
        commandType: isNpx ? 'npx' : 'npm',
    };
}
function getUpdateCommandLabel(isNpx, isPrimary) {
    if (isPrimary) {
        return 'Copy Command';
    }
    return isNpx ? 'or global install' : 'or npx';
}
//# sourceMappingURL=updateCommands.js.map