"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PLUGINS_DIR = path_1.default.join(__dirname, '../../../src/redteam/plugins');
const DOCS_DIR = path_1.default.join(__dirname, '../../../site/docs/red-team/plugins');
function getFiles(dir, extension, excludes = []) {
    return fs_1.default
        .readdirSync(dir)
        .filter((file) => file.endsWith(extension) && !excludes.includes(file))
        .map((file) => file.replace(extension, ''));
}
function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function toCamelCase(str) {
    return str.replace(/-./g, (x) => x[1].toUpperCase());
}
async function loadPluginsFromConstants() {
    const constantsPath = path_1.default.join(__dirname, '../../../src/redteam/constants/plugins.ts');
    // Import the module to get the actual values
    const pluginsModule = await Promise.resolve(`${constantsPath}`).then(s => __importStar(require(s)));
    const allPlugins = new Set();
    // Collect all plugins from different arrays
    const pluginArrays = [
        'FOUNDATION_PLUGINS',
        'AGENTIC_PLUGINS',
        'BASE_PLUGINS',
        'ADDITIONAL_PLUGINS',
        'CONFIG_REQUIRED_PLUGINS',
        'PII_PLUGINS',
        'BIAS_PLUGINS',
    ];
    for (const arrayName of pluginArrays) {
        const array = pluginsModule[arrayName];
        if (Array.isArray(array)) {
            array.forEach((plugin) => allPlugins.add(plugin));
        }
    }
    // Add harm plugins
    if (pluginsModule.HARM_PLUGINS) {
        Object.keys(pluginsModule.HARM_PLUGINS).forEach((plugin) => allPlugins.add(plugin));
    }
    return allPlugins;
}
async function loadPluginsFromDocs() {
    const docsPath = path_1.default.join(__dirname, '../../../site/docs/_shared/data/plugins.ts');
    // Import the module to get the actual values
    const docsModule = await Promise.resolve(`${docsPath}`).then(s => __importStar(require(s)));
    const allPlugins = new Set();
    // Extract pluginId from each plugin in the PLUGINS array
    if (docsModule.PLUGINS && Array.isArray(docsModule.PLUGINS)) {
        docsModule.PLUGINS.forEach((plugin) => {
            if (plugin.pluginId) {
                allPlugins.add(plugin.pluginId);
            }
        });
    }
    else {
        throw new Error('PLUGINS array not found in docs file');
    }
    return allPlugins;
}
describe('Plugin Documentation', () => {
    const pluginFiles = getFiles(PLUGINS_DIR, '.ts', [
        'index.ts',
        'base.ts',
        'imageDatasetPluginBase.ts',
        'imageDatasetUtils.ts',
    ]);
    const docFiles = getFiles(DOCS_DIR, '.md', ['_category_.json']);
    describe('Plugin files and documentation files', () => {
        it('should have matching plugin and documentation files', () => {
            const pluginSet = new Set(pluginFiles.map(toKebabCase));
            const docSet = new Set(docFiles);
            // Check that all plugins have corresponding docs
            pluginSet.forEach((plugin) => {
                expect(docSet.has(plugin)).toBe(true);
            });
        });
        it('should have correct naming conventions for plugins and docs', () => {
            pluginFiles.forEach((plugin) => {
                const kebabPlugin = toKebabCase(plugin);
                expect(docFiles).toContain(kebabPlugin);
                expect(pluginFiles).toContain(toCamelCase(kebabPlugin));
            });
        });
    });
    describe('Plugin data synchronization', () => {
        it('should have all plugins from constants in documentation data', async () => {
            const constantsPlugins = await loadPluginsFromConstants();
            const docsPlugins = await loadPluginsFromDocs();
            // Find plugins missing from docs
            const missingFromDocs = [...constantsPlugins].filter((plugin) => !docsPlugins.has(plugin));
            if (missingFromDocs.length > 0) {
                console.log('\nPlugins missing from documentation data:');
                missingFromDocs.forEach((plugin) => console.log(`  - ${plugin}`));
                console.log('\nAdd these plugins to site/docs/_shared/data/plugins.ts');
            }
            expect(missingFromDocs).toEqual([]);
        });
        it('should not have orphaned plugins in documentation data', async () => {
            const constantsPlugins = await loadPluginsFromConstants();
            const docsPlugins = await loadPluginsFromDocs();
            // Find plugins missing from constants
            const missingFromConstants = [...docsPlugins].filter((plugin) => !constantsPlugins.has(plugin));
            if (missingFromConstants.length > 0) {
                console.log('\nOrphaned plugins in documentation data:');
                missingFromConstants.forEach((plugin) => console.log(`  - ${plugin}`));
                console.log('\nRemove these from site/docs/_shared/data/plugins.ts or add them to src/redteam/constants/plugins.ts');
            }
            expect(missingFromConstants).toEqual([]);
        });
        it('should have plugin constants and documentation data files', async () => {
            const constantsPath = path_1.default.join(__dirname, '../../../src/redteam/constants/plugins.ts');
            const docsPath = path_1.default.join(__dirname, '../../../site/docs/_shared/data/plugins.ts');
            expect(fs_1.default.existsSync(constantsPath)).toBe(true);
            expect(fs_1.default.existsSync(docsPath)).toBe(true);
        });
    });
});
//# sourceMappingURL=pluginDocumentation.test.js.map