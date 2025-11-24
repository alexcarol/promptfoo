/**
 * Shared authentication utilities
 * Reusable across HTTP requests and socket.io connections
 */
import type { SocketAuthCredentials } from '../../types/codeScan';
/**
 * Resolve authentication credentials using waterfall approach:
 * 1. API key from CLI argument or config file (passed as parameter)
 * 2. PROMPTFOO_API_KEY environment variable
 * 3. API key from promptfoo auth (cloudConfig)
 * 4. GitHub OIDC token (environment variable)
 *
 * @param apiKey Optional API key from CLI arg or config file
 * @returns Resolved auth credentials
 */
export declare function resolveAuthCredentials(apiKey?: string): SocketAuthCredentials;
//# sourceMappingURL=auth.d.ts.map