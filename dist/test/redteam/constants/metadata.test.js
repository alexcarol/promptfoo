"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("../../../src/redteam/constants/metadata");
const plugins_1 = require("../../../src/redteam/constants/plugins");
describe('metadata constants', () => {
    describe('Risk category severity map', () => {
        it('should have valid severity levels', () => {
            Object.values(metadata_1.riskCategorySeverityMap).forEach((severity) => {
                expect(Object.values(metadata_1.Severity)).toContain(severity);
            });
        });
    });
    describe('Risk categories', () => {
        it('should have valid category descriptions', () => {
            Object.keys(metadata_1.riskCategories).forEach((category) => {
                // @ts-expect-error: categoryDescriptions is only indexed by TopLevelCategory (not string)
                expect(metadata_1.categoryDescriptions[category]).toBeDefined();
                // @ts-expect-error: categoryDescriptions is only indexed by TopLevelCategory (not string)
                expect(typeof metadata_1.categoryDescriptions[category]).toBe('string');
            });
        });
        it('should have valid category mapping for each plugin', () => {
            Object.entries(metadata_1.categoryMapReverse).forEach(([plugin, category]) => {
                const foundInCategory = Object.entries(metadata_1.riskCategories).some(([cat, plugins]) => cat === category && plugins.includes(plugin));
                expect(foundInCategory).toBe(true);
            });
        });
        it('should have matching category labels', () => {
            expect(metadata_1.categoryLabels).toEqual(Object.keys(metadata_1.categoryMapReverse));
        });
        it('should not include duplicate plugin ids within a category', () => {
            Object.entries(metadata_1.riskCategories).forEach(([_category, plugins]) => {
                const uniquePlugins = new Set(plugins);
                expect(uniquePlugins.size).toBe(plugins.length);
            });
        });
        it('should include all defined plugins in risk categories', () => {
            // Get all plugins from risk categories
            const riskCategoryPlugins = new Set();
            Object.values(metadata_1.riskCategories).forEach((plugins) => {
                plugins.forEach((plugin) => {
                    riskCategoryPlugins.add(plugin);
                });
            });
            // Get all defined plugins from constants
            const allDefinedPlugins = new Set();
            // Add plugins from various constant arrays
            [...plugins_1.BASE_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            [...plugins_1.ADDITIONAL_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            [...plugins_1.BIAS_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            [...plugins_1.PII_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            [...plugins_1.MEDICAL_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            [...plugins_1.FINANCIAL_PLUGINS].forEach((plugin) => allDefinedPlugins.add(plugin));
            // Add plugins from HARM_PLUGINS object
            Object.keys(plugins_1.HARM_PLUGINS).forEach((plugin) => {
                allDefinedPlugins.add(plugin);
            });
            // Special plugins that shouldn't be in risk categories (collections and custom plugins)
            const excludedPlugins = new Set([
                'intent', // Custom intent plugin handled separately in UI
                'policy', // Custom policy plugin handled separately in UI
                'default', // Collection
                'foundation', // Collection
                'harmful', // Collection
                'bias', // Collection
                'pii', // Collection
                'medical', // Collection
                'guardrails-eval', // Collection
            ]);
            // Find plugins that are defined but missing from risk categories
            const missingPlugins = Array.from(allDefinedPlugins).filter((plugin) => !riskCategoryPlugins.has(plugin) && !excludedPlugins.has(plugin));
            if (missingPlugins.length > 0) {
                throw new Error(`The following plugins are defined but missing from risk categories: ${missingPlugins.join(', ')}. Please add them to the appropriate category in riskCategories object in metadata.ts`);
            }
            expect(missingPlugins).toEqual([]);
        });
    });
    describe('Category aliases', () => {
        it('should have valid aliases mapping', () => {
            const uniqueValues = new Set(Object.values(metadata_1.categoryAliases));
            uniqueValues.forEach((value) => {
                const keys = Object.entries(metadata_1.categoryAliases)
                    .filter(([, v]) => v === value)
                    .map(([k]) => k);
                const reverseKey = metadata_1.categoryAliasesReverse[value];
                expect(keys).toContain(reverseKey);
            });
        });
    });
    describe('Plugin and strategy descriptions', () => {
        it('should have descriptions for all plugins', () => {
            Object.keys(metadata_1.pluginDescriptions).forEach((plugin) => {
                expect(typeof metadata_1.pluginDescriptions[plugin]).toBe('string');
                expect(metadata_1.pluginDescriptions[plugin].length).toBeGreaterThan(0);
            });
        });
        it('should have descriptions for all strategies', () => {
            Object.keys(metadata_1.strategyDescriptions).forEach((strategy) => {
                expect(typeof metadata_1.strategyDescriptions[strategy]).toBe('string');
                expect(metadata_1.strategyDescriptions[strategy].length).toBeGreaterThan(0);
            });
        });
        it('should have display names for all strategies', () => {
            Object.keys(metadata_1.strategyDisplayNames).forEach((strategy) => {
                expect(typeof metadata_1.strategyDisplayNames[strategy]).toBe('string');
                expect(metadata_1.strategyDisplayNames[strategy].length).toBeGreaterThan(0);
            });
        });
    });
    describe('Plugin preset descriptions', () => {
        it('should have valid preset descriptions', () => {
            Object.entries(metadata_1.PLUGIN_PRESET_DESCRIPTIONS).forEach(([preset, description]) => {
                expect(typeof preset).toBe('string');
                expect(typeof description).toBe('string');
                expect(description.length).toBeGreaterThan(0);
            });
        });
    });
    describe('Display name overrides', () => {
        it('should have display names for memory poisoning plugin', () => {
            expect(metadata_1.displayNameOverrides['agentic:memory-poisoning']).toBe('Agentic Memory Poisoning');
        });
        it('should have matching subcategory descriptions', () => {
            Object.keys(metadata_1.displayNameOverrides).forEach((key) => {
                const keyAsPluginOrStrategy = key;
                expect(metadata_1.subCategoryDescriptions[keyAsPluginOrStrategy]).toBeDefined();
            });
        });
    });
    describe('Default output path', () => {
        it('should be defined correctly', () => {
            expect(metadata_1.DEFAULT_OUTPUT_PATH).toBe('redteam.yaml');
        });
    });
});
//# sourceMappingURL=metadata.test.js.map