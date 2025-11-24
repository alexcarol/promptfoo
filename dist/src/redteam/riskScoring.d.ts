import { Severity } from './constants';
export interface StrategyMetadata {
    humanExploitable: boolean;
    humanComplexity: 'low' | 'medium' | 'high';
}
export interface TestResults {
    total: number;
    passed: number;
    failed: number;
}
export interface PluginTestResult {
    pluginId: string;
    severity: Severity;
    strategy: string;
    results: TestResults;
}
export interface RiskScore {
    score: number;
    level: 'critical' | 'high' | 'medium' | 'low';
    components: {
        impact: number;
        exploitability: number;
        humanFactor: number;
        strategyWeight: number;
    };
}
export interface PluginRiskScore extends RiskScore {
    pluginId: string;
    severity: Severity;
    complexityScore: number;
    worstStrategy: string;
    strategyBreakdown: Array<{
        strategy: string;
        score: number;
        successRate: number;
    }>;
}
export interface SystemRiskScore extends RiskScore {
    plugins: PluginRiskScore[];
    distribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
export declare function getStrategyMetadata(strategy: string): StrategyMetadata;
/**
 * Calculate exploitability score based on strategy complexity
 * Returns a score from 0-10 indicating how easy it is to exploit
 */
export declare function calculateExploitabilityScore(metadata: StrategyMetadata): number;
/**
 * Convert exploitability score to complexity score for user display
 * Higher complexity score = more complex/difficult attack
 * This inverts the exploitability score so it makes intuitive sense to users
 */
export declare function calculateComplexityScore(metadata: StrategyMetadata): number;
export declare function calculatePluginRiskScore(pluginId: string, severity: Severity, testResults: Array<{
    strategy: string;
    results: TestResults;
}>): PluginRiskScore;
export declare function calculateSystemRiskScore(pluginScores: PluginRiskScore[]): SystemRiskScore;
/**
 * Helper function to prepare test results from component data
 */
export declare function prepareTestResultsFromStats(failuresByPlugin: Record<string, any[]> | undefined, passesByPlugin: Record<string, any[]> | undefined, subCategory: string, categoryStats: Record<string, {
    pass: number;
    total: number;
}>, getStrategyId?: (test: any) => string): Array<{
    strategy: string;
    results: TestResults;
}>;
export declare function formatRiskScore(score: RiskScore): string;
export declare function getRiskColor(level: RiskScore['level']): string;
//# sourceMappingURL=riskScoring.d.ts.map