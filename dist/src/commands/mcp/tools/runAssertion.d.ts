import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Run an assertion against an LLM output to test grading logic
 *
 * Use this tool to:
 * - Test assertion configurations before using them in evaluations
 * - Debug why specific outputs are passing or failing assertions
 * - Validate grading logic for custom assertions
 * - Experiment with different assertion parameters
 *
 * Supports all promptfoo assertion types including:
 * - Content checks: contains, equals, regex, starts-with
 * - LLM-graded: llm-rubric, factuality, answer-relevance
 * - Format validation: is-json, is-xml, is-sql
 * - Quality metrics: similarity, perplexity, cost, latency
 * - Custom: javascript, python, webhook assertions
 */
export declare function registerRunAssertionTool(server: McpServer): void;
//# sourceMappingURL=runAssertion.d.ts.map