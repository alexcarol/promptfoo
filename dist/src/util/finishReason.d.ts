/**
 * Mapping of provider-specific finish/stop reasons to standardized OpenAI-compatible values.
 *
 * This normalization allows consistent finish reason handling across different LLM providers:
 *
 * **OpenAI Standard Values:**
 * - `stop`: Natural completion (reached end_of_turn, stop sequence, etc.)
 * - `length`: Token limit reached (max_tokens, context length, etc.)
 * - `content_filter`: Content filtering triggered
 * - `tool_calls`: Model made function/tool calls
 *
 * **Provider Mappings:**
 * - OpenAI: `function_call` (legacy) → `tool_calls` (current)
 * - Anthropic: `end_turn` → `stop`, `stop_sequence` → `stop`, `max_tokens` → `length`, `tool_use` → `tool_calls`
 *
 * @example
 * ```typescript
 * normalizeFinishReason('end_turn')     // Returns: 'stop'
 * normalizeFinishReason('max_tokens')   // Returns: 'length'
 * normalizeFinishReason('tool_use')     // Returns: 'tool_calls'
 * normalizeFinishReason('function_call') // Returns: 'tool_calls'
 * normalizeFinishReason('unknown')      // Returns: 'unknown' (passthrough)
 * ```
 */
export declare const FINISH_REASON_MAP: Record<string, string>;
/**
 * Normalize a provider-specific finish or stop reason to a standard OpenAI-compatible value.
 *
 * This function standardizes finish reasons across different LLM providers to enable
 * consistent handling in assertions and application logic. Unknown values are passed
 * through unchanged to preserve provider-specific reasons.
 *
 * @param raw - The raw finish_reason/stop_reason from the provider response
 * @returns A normalized finish reason string, or undefined if input is invalid
 *
 * @example Basic usage
 * ```typescript
 * const result = await provider.callApi('Hello world');
 * const normalized = normalizeFinishReason(result.finishReason);
 * // normalized will be one of: 'stop', 'length', 'content_filter', 'tool_calls', or original value
 * ```
 *
 * @example With finish-reason assertion
 * ```yaml
 * assert:
 *   - type: finish-reason
 *     value: stop  # Expects natural completion (works for both 'stop' and 'end_turn')
 * ```
 */
export declare function normalizeFinishReason(raw?: string | null): string | undefined;
//# sourceMappingURL=finishReason.d.ts.map