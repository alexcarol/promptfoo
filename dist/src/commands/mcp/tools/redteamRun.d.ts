import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Run a redteam scan to test AI systems for vulnerabilities
 *
 * Use this tool to:
 * - Execute comprehensive security testing against AI applications
 * - Generate and run adversarial test cases automatically
 * - Test for jailbreaks, prompt injections, and harmful outputs
 * - Validate AI safety guardrails and content filters
 *
 * The redteam run performs a two-step process:
 * 1. Generates dynamic attack probes tailored to your target application
 * 2. Evaluates the generated probes against your target application
 *
 * Perfect for:
 * - Security auditing of AI systems
 * - Compliance testing and safety validation
 * - Red team exercises and penetration testing
 * - Finding vulnerabilities before deployment
 */
export declare function registerRedteamRunTool(server: McpServer): void;
//# sourceMappingURL=redteamRun.d.ts.map