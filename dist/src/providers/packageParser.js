"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPackagePath = isPackagePath;
exports.loadFromPackage = loadFromPackage;
exports.parsePackageProvider = parsePackageProvider;
const node_module_1 = require("node:module");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
function getValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
        return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
}
function isPackagePath(path) {
    return typeof path === 'string' && path.startsWith('package:');
}
async function loadFromPackage(packageInstancePath, basePath) {
    const [, packageName, entityName] = packageInstancePath.split(':');
    if (!packageName || !entityName) {
        throw new Error(`Invalid package format: ${packageInstancePath}. Expected format: package:packageName:exportedClassOrFunction`);
    }
    // First, try to resolve the package path
    let filePath;
    try {
        const require = (0, node_module_1.createRequire)(path_1.default.resolve(basePath));
        filePath = require.resolve(packageName);
    }
    catch {
        throw new Error(`Package not found: ${packageName}. Make sure it's installed in ${basePath}`);
    }
    // Then, try to import the module
    try {
        const module = await (0, esm_1.importModule)(filePath);
        const entity = getValue(module, entityName ?? 'default');
        if (!entity) {
            logger_1.default.error((0, dedent_1.default) `
        Could not find entity: ${chalk_1.default.bold(entityName)} in module: ${chalk_1.default.bold(filePath)}.
      `);
            process.exit(1);
        }
        return entity;
    }
    catch (error) {
        throw new Error(`Failed to import module: ${packageName}. Error: ${error}`);
    }
}
async function parsePackageProvider(providerPath, basePath, options) {
    const Provider = await loadFromPackage(providerPath, basePath);
    return new Provider(options);
}
//# sourceMappingURL=packageParser.js.map