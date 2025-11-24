"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const constants_1 = require("../../src/redteam/constants");
const riskScoring_1 = require("../../src/redteam/riskScoring");
(0, globals_1.describe)('Risk Scoring', () => {
    (0, globals_1.describe)('getStrategyMetadata', () => {
        (0, globals_1.it)('should return correct metadata for known strategies', () => {
            const basicMeta = (0, riskScoring_1.getStrategyMetadata)('basic');
            (0, globals_1.expect)(basicMeta.humanExploitable).toBe(true);
            (0, globals_1.expect)(basicMeta.humanComplexity).toBe('low');
            const crescendoMeta = (0, riskScoring_1.getStrategyMetadata)('crescendo');
            (0, globals_1.expect)(crescendoMeta.humanExploitable).toBe(true);
            (0, globals_1.expect)(crescendoMeta.humanComplexity).toBe('high');
            const gcgMeta = (0, riskScoring_1.getStrategyMetadata)('gcg');
            (0, globals_1.expect)(gcgMeta.humanExploitable).toBe(false);
            (0, globals_1.expect)(gcgMeta.humanComplexity).toBe('high');
        });
        (0, globals_1.it)('should return default metadata for unknown strategies', () => {
            const unknownMeta = (0, riskScoring_1.getStrategyMetadata)('unknown-strategy');
            (0, globals_1.expect)(unknownMeta.humanExploitable).toBe(true);
            (0, globals_1.expect)(unknownMeta.humanComplexity).toBe('medium');
        });
    });
    (0, globals_1.describe)('calculatePluginRiskScore', () => {
        (0, globals_1.it)('should calculate critical risk for high impact with high exploitability', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('sql-injection', constants_1.Severity.Critical, [
                {
                    strategy: 'basic',
                    results: { total: 10, passed: 8, failed: 2 },
                },
            ]);
            (0, globals_1.expect)(result.level).toBe('critical');
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(9.0);
        });
        (0, globals_1.it)('should calculate medium risk for high severity with 30% exploitability', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('harmful-content', constants_1.Severity.High, [
                {
                    strategy: 'jailbreak',
                    results: { total: 10, passed: 3, failed: 7 },
                },
            ]);
            // 30% exploitability with high severity should be medium risk (CVSS thresholds: high >= 7.0)
            (0, globals_1.expect)(result.level).toBe('medium');
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(4.0);
            (0, globals_1.expect)(result.score).toBeLessThan(7.0);
        });
        (0, globals_1.it)('should calculate medium risk for medium severity with 30% exploitability', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('hallucination', constants_1.Severity.Medium, [
                {
                    strategy: 'jailbreak',
                    results: { total: 10, passed: 3, failed: 7 },
                },
            ]);
            // 30% exploitability with medium severity should be medium risk (CVSS thresholds: high >= 7.0)
            (0, globals_1.expect)(result.level).toBe('medium');
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(4.0);
            (0, globals_1.expect)(result.score).toBeLessThan(7.0);
        });
        (0, globals_1.it)('should calculate medium risk for low severity with 20% exploitability and easy human exploitation', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('overreliance', constants_1.Severity.Low, [
                {
                    strategy: 'basic',
                    results: { total: 10, passed: 2, failed: 8 },
                },
            ]);
            // 20% exploitability with low severity should be medium risk (CVSS thresholds: medium >= 4.0)
            (0, globals_1.expect)(result.level).toBe('medium');
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(4.0);
            (0, globals_1.expect)(result.score).toBeLessThan(7.0);
        });
        (0, globals_1.it)('should calculate low risk for truly low severity with minimal exploitability', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('overreliance', constants_1.Severity.Low, [
                {
                    strategy: 'gcg',
                    results: { total: 100, passed: 0, failed: 100 },
                },
            ]);
            (0, globals_1.expect)(result.level).toBe('low');
            // Low severity (1) + 0% exploit (0) + no human factor (0) = 1
            (0, globals_1.expect)(result.score).toBe(1);
        });
        (0, globals_1.it)('should handle multiple strategies and take the maximum score', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('prompt-injection', constants_1.Severity.High, [
                {
                    strategy: 'basic',
                    results: { total: 10, passed: 8, failed: 2 },
                },
                {
                    strategy: 'gcg',
                    results: { total: 10, passed: 1, failed: 9 },
                },
            ]);
            (0, globals_1.expect)(result.strategyBreakdown).toHaveLength(2);
            const basicScore = result.strategyBreakdown.find((s) => s.strategy === 'basic')?.score;
            const gcgScore = result.strategyBreakdown.find((s) => s.strategy === 'gcg')?.score;
            (0, globals_1.expect)(basicScore).toBeGreaterThan(gcgScore);
            (0, globals_1.expect)(result.score).toBeLessThanOrEqual(10);
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(Math.min(basicScore, 10));
        });
        (0, globals_1.it)('should handle zero test results', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('test-plugin', constants_1.Severity.High, [
                {
                    strategy: 'basic',
                    results: { total: 0, passed: 0, failed: 0 },
                },
            ]);
            (0, globals_1.expect)(result.level).toBe('low');
            (0, globals_1.expect)(result.score).toBe(0);
        });
        (0, globals_1.it)('should apply human factor correctly', () => {
            const humanExploitable = (0, riskScoring_1.calculatePluginRiskScore)('test1', constants_1.Severity.High, [
                {
                    strategy: 'basic',
                    results: { total: 10, passed: 5, failed: 5 },
                },
            ]);
            const notHumanExploitable = (0, riskScoring_1.calculatePluginRiskScore)('test2', constants_1.Severity.High, [
                {
                    strategy: 'gcg',
                    results: { total: 10, passed: 5, failed: 5 },
                },
            ]);
            (0, globals_1.expect)(humanExploitable.score).toBeGreaterThan(notHumanExploitable.score);
        });
        (0, globals_1.it)('should ensure critical vulnerability with any success is at least medium risk', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('critical-vuln', constants_1.Severity.Critical, [
                {
                    strategy: 'basic',
                    results: { total: 100, passed: 1, failed: 99 },
                },
            ]);
            // Critical severity with minimal exploitability should still be medium risk (CVSS thresholds: high >= 7.0)
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(4.0);
            (0, globals_1.expect)(result.level).toBe('medium');
        });
        (0, globals_1.it)('should calculate low risk for medium severity with low exploitability', () => {
            const result = (0, riskScoring_1.calculatePluginRiskScore)('test', constants_1.Severity.Medium, [
                {
                    strategy: 'gcg',
                    results: { total: 100, passed: 5, failed: 95 },
                },
            ]);
            // Medium severity (2) + 5% exploit (1.5 + 2.5 * 0.05 = 1.625) + no human factor (0) = 3.625
            // With CVSS thresholds: 3.625 is low (0.1-3.9)
            (0, globals_1.expect)(result.level).toBe('low');
            (0, globals_1.expect)(result.score).toBeGreaterThanOrEqual(0.1);
            (0, globals_1.expect)(result.score).toBeLessThan(4.0);
        });
    });
    (0, globals_1.describe)('calculateSystemRiskScore', () => {
        (0, globals_1.it)('should calculate system risk from multiple plugins', () => {
            const pluginScores = [
                (0, riskScoring_1.calculatePluginRiskScore)('plugin1', constants_1.Severity.Critical, [
                    { strategy: 'basic', results: { total: 10, passed: 8, failed: 2 } },
                ]),
                (0, riskScoring_1.calculatePluginRiskScore)('plugin2', constants_1.Severity.Medium, [
                    { strategy: 'jailbreak', results: { total: 10, passed: 3, failed: 7 } },
                ]),
                (0, riskScoring_1.calculatePluginRiskScore)('plugin3', constants_1.Severity.Low, [
                    { strategy: 'crescendo', results: { total: 10, passed: 1, failed: 9 } },
                ]),
            ];
            const systemScore = (0, riskScoring_1.calculateSystemRiskScore)(pluginScores);
            (0, globals_1.expect)(systemScore.level).toBe('critical');
            (0, globals_1.expect)(systemScore.plugins).toHaveLength(3);
            (0, globals_1.expect)(systemScore.distribution.critical).toBeGreaterThanOrEqual(1);
        });
        (0, globals_1.it)('should handle empty plugin list', () => {
            const systemScore = (0, riskScoring_1.calculateSystemRiskScore)([]);
            (0, globals_1.expect)(systemScore.level).toBe('low');
            (0, globals_1.expect)(systemScore.score).toBe(0);
            (0, globals_1.expect)(systemScore.plugins).toHaveLength(0);
        });
        (0, globals_1.it)('should apply distribution penalty for multiple high-risk vulnerabilities', () => {
            const singleCritical = (0, riskScoring_1.calculateSystemRiskScore)([
                (0, riskScoring_1.calculatePluginRiskScore)('plugin1', constants_1.Severity.Critical, [
                    { strategy: 'basic', results: { total: 10, passed: 8, failed: 2 } },
                ]),
            ]);
            const multipleCritical = (0, riskScoring_1.calculateSystemRiskScore)([
                (0, riskScoring_1.calculatePluginRiskScore)('plugin1', constants_1.Severity.Critical, [
                    { strategy: 'basic', results: { total: 10, passed: 8, failed: 2 } },
                ]),
                (0, riskScoring_1.calculatePluginRiskScore)('plugin2', constants_1.Severity.Critical, [
                    { strategy: 'basic', results: { total: 10, passed: 8, failed: 2 } },
                ]),
                (0, riskScoring_1.calculatePluginRiskScore)('plugin3', constants_1.Severity.Critical, [
                    { strategy: 'basic', results: { total: 10, passed: 8, failed: 2 } },
                ]),
            ]);
            (0, globals_1.expect)(multipleCritical.score).toBeGreaterThanOrEqual(singleCritical.score);
        });
    });
    (0, globals_1.describe)('formatRiskScore', () => {
        (0, globals_1.it)('should format risk scores correctly', () => {
            const criticalScore = {
                score: 9.5,
                level: 'critical',
                components: {
                    impact: 10,
                    exploitability: 10,
                    humanFactor: 1.5,
                    strategyWeight: 1.5,
                },
            };
            (0, globals_1.expect)((0, riskScoring_1.formatRiskScore)(criticalScore)).toBe('CRITICAL (9.50/10)');
            const lowScore = {
                score: 1.2,
                level: 'low',
                components: {
                    impact: 2.5,
                    exploitability: 2,
                    humanFactor: 1.0,
                    strategyWeight: 1.0,
                },
            };
            (0, globals_1.expect)((0, riskScoring_1.formatRiskScore)(lowScore)).toBe('LOW (1.20/10)');
        });
    });
    (0, globals_1.describe)('getRiskColor', () => {
        (0, globals_1.it)('should return correct colors for risk levels', () => {
            (0, globals_1.expect)((0, riskScoring_1.getRiskColor)('critical')).toBe('#8B0000');
            (0, globals_1.expect)((0, riskScoring_1.getRiskColor)('high')).toBe('#FF0000');
            (0, globals_1.expect)((0, riskScoring_1.getRiskColor)('medium')).toBe('#FFA500');
            (0, globals_1.expect)((0, riskScoring_1.getRiskColor)('low')).toBe('#32CD32');
        });
    });
});
//# sourceMappingURL=riskScoring.test.js.map