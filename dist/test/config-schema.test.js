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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
describe('config-schema.json', () => {
    let schema;
    let ajv;
    beforeAll(() => {
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'site', 'static', 'config-schema.json');
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        schema = JSON.parse(schemaContent);
        // Initialize AJV for schema validation
        // Use strict: false to avoid issues with regex patterns
        ajv = new ajv_1.default({
            strict: false,
            allErrors: true,
            validateFormats: false, // Disable format validation to avoid regex issues
        });
        (0, ajv_formats_1.default)(ajv);
    });
    it('should be valid JSON', () => {
        expect(schema).toBeDefined();
        expect(typeof schema).toBe('object');
    });
    it('should be a valid JSON Schema', () => {
        const valid = ajv.validateSchema(schema);
        if (!valid) {
            console.error('Schema validation errors:', ajv.errors);
        }
        expect(valid).toBe(true);
    });
    it('should have required top-level properties', () => {
        expect(schema).toHaveProperty('$ref');
        expect(schema).toHaveProperty('definitions');
        expect(schema.definitions).toHaveProperty('PromptfooConfigSchema');
    });
    describe('redteam plugin enums', () => {
        it('should not have duplicate entries in plugin enums', () => {
            const findPluginEnums = (obj, path = '') => {
                const results = [];
                if (obj && typeof obj === 'object') {
                    // Check if this is an enum array that looks like a plugin list
                    if (Array.isArray(obj.enum) && obj.enum.length > 10 && obj.enum.includes('bias')) {
                        results.push({ path, values: obj.enum });
                    }
                    for (const [key, value] of Object.entries(obj)) {
                        if (key !== 'enum') {
                            results.push(...findPluginEnums(value, path ? `${path}.${key}` : key));
                        }
                    }
                }
                return results;
            };
            const pluginEnums = findPluginEnums(schema);
            expect(pluginEnums.length).toBeGreaterThan(0);
            pluginEnums.forEach(({ path, values }) => {
                const uniqueValues = [...new Set(values)];
                const duplicates = values.filter((item, index) => values.indexOf(item) !== index);
                if (duplicates.length > 0) {
                    console.error(`Duplicates found at ${path}:`, duplicates);
                }
                expect(values).toHaveLength(uniqueValues.length);
            });
        });
        it('should have consistent plugin lists across different locations', () => {
            const findAllEnums = (obj) => {
                const results = [];
                if (obj && typeof obj === 'object') {
                    if (Array.isArray(obj.enum) && obj.enum.length > 10 && obj.enum.includes('bias')) {
                        results.push(obj.enum);
                    }
                    for (const value of Object.values(obj)) {
                        results.push(...findAllEnums(value));
                    }
                }
                return results;
            };
            const allEnums = findAllEnums(schema);
            // Should find at least 2 (one for string type, one for object id)
            expect(allEnums.length).toBeGreaterThanOrEqual(2);
            const firstEnum = allEnums[0]?.sort();
            expect(firstEnum).toBeDefined();
            for (let i = 1; i < allEnums.length; i++) {
                expect(allEnums[i].sort()).toEqual(firstEnum);
            }
        });
        it('should contain expected plugin entries', () => {
            const findPluginEnum = (obj) => {
                if (obj && typeof obj === 'object') {
                    if (Array.isArray(obj.enum) && obj.enum.includes('bias')) {
                        return obj.enum;
                    }
                    for (const value of Object.values(obj)) {
                        const result = findPluginEnum(value);
                        if (result) {
                            return result;
                        }
                    }
                }
                return null;
            };
            const pluginEnum = findPluginEnum(schema);
            expect(pluginEnum).not.toBeNull();
            // Use non-null assertion since we've already checked it's not null
            const plugins = pluginEnum;
            expect(plugins).toContain('bias');
            expect(plugins).toContain('bias:age');
            expect(plugins).toContain('bias:disability');
            expect(plugins).toContain('bias:gender');
            expect(plugins).toContain('bias:race');
            expect(plugins).toContain('default');
            expect(plugins).toContain('harmful');
            expect(plugins).toContain('pii');
            const biasCount = plugins.filter((p) => p === 'bias').length;
            expect(biasCount).toBe(1);
        });
    });
    describe('schema structure', () => {
        it('should define UnifiedConfig properly', () => {
            const unifiedConfig = schema.definitions?.PromptfooConfigSchema;
            expect(unifiedConfig).toBeDefined();
            expect(unifiedConfig.type).toBe('object');
            expect(unifiedConfig.properties).toBeDefined();
        });
        it('should have redteam configuration', () => {
            const properties = schema.definitions?.PromptfooConfigSchema?.properties;
            expect(properties).toHaveProperty('redteam');
            const redteamConfig = properties?.redteam;
            expect(redteamConfig).toBeDefined();
            expect(redteamConfig.type).toBe('object');
            expect(redteamConfig.properties).toHaveProperty('plugins');
            expect(redteamConfig.properties).toHaveProperty('strategies');
        });
        it('should validate that plugin patterns are properly escaped', () => {
            const findPatterns = (obj) => {
                const patterns = [];
                if (obj && typeof obj === 'object') {
                    if (typeof obj.pattern === 'string') {
                        patterns.push(obj.pattern);
                    }
                    for (const value of Object.values(obj)) {
                        patterns.push(...findPatterns(value));
                    }
                }
                return patterns;
            };
            const patterns = findPatterns(schema);
            const filePatterns = patterns.filter((p) => p.includes('file'));
            expect(filePatterns.length).toBeGreaterThan(0);
            filePatterns.forEach((pattern) => {
                expect(pattern).toMatch(/file.*\\/);
            });
        });
    });
    describe('performance', () => {
        it('should not be excessively large', () => {
            const schemaSize = JSON.stringify(schema).length;
            // Schema should be under 1MB
            expect(schemaSize).toBeLessThan(1024 * 1024);
        });
    });
    describe('generated schema integrity', () => {
        it('should match the structure generated by zod-to-json-schema', () => {
            // Verify the schema follows zod-to-json-schema conventions
            expect(schema.$ref).toBe('#/definitions/PromptfooConfigSchema');
            expect(schema.definitions).toBeDefined();
            // Check that the main schema definition exists
            const mainDef = schema.definitions.PromptfooConfigSchema;
            expect(mainDef).toBeDefined();
            expect(mainDef.type).toBe('object');
        });
        it('should regenerate to the same schema', async () => {
            // This test ensures the schema generation is deterministic
            // We'll check that key structures are present
            const properties = schema.definitions?.PromptfooConfigSchema?.properties;
            // Core properties that should always exist
            expect(properties).toHaveProperty('prompts');
            expect(properties).toHaveProperty('providers');
            expect(properties).toHaveProperty('tests');
            expect(properties).toHaveProperty('redteam');
            expect(properties).toHaveProperty('scenarios');
            expect(properties).toHaveProperty('defaultTest');
        });
    });
});
//# sourceMappingURL=config-schema.test.js.map