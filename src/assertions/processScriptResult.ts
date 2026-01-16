import { type Assertion, type GradingResult, isGradingResult } from '../types/index';
import { mapSnakeCaseToCamelCase } from '../util/caseMapping';

export interface ProcessScriptResultOptions {
  inverse: boolean;
  threshold?: number;
  assertion: Assertion;
  runtime: 'javascript' | 'python' | 'ruby';
  /** Optional code snippet to include in failure messages */
  codeSnippet?: string;
}

/**
 * Normalizes a raw script result to boolean | number | GradingResult.
 *
 * Different runtimes have different result formats:
 * - JavaScript: boolean, number, or GradingResult object
 * - Python/Ruby: also supports string "true"/"false", JSON strings, and snake_case keys
 */
function normalizeResult(
  raw: unknown,
  runtime: 'javascript' | 'python' | 'ruby',
): boolean | number | GradingResult {
  // Handle string results (Python/Ruby only - their wrappers may return strings)
  if (runtime !== 'javascript' && typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'true') {
      return true;
    }
    if (lower === 'false') {
      return false;
    }
    // Try parsing as JSON GradingResult
    if (raw.startsWith('{')) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err} when parsing result: ${raw}`);
      }
      const mapped = mapSnakeCaseToCamelCase(parsed);
      if (!isGradingResult(mapped)) {
        throw new Error(
          `${runtime} assertion must return a boolean, number, or {pass, score, reason} object. Got instead: ${raw}`,
        );
      }
      return mapped as GradingResult;
    }
    // Try parsing as number
    const num = Number.parseFloat(raw);
    if (!Number.isNaN(num)) {
      return num;
    }
    throw new Error(
      `${runtime} assertion must return a boolean, number, or {pass, score, reason} object. Instead got:\n${raw}`,
    );
  }

  // Handle object results (may need snake_case mapping for Python/Ruby)
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const mapped = runtime !== 'javascript' ? mapSnakeCaseToCamelCase(raw) : raw;
    if (isGradingResult(mapped)) {
      return mapped as GradingResult;
    }
    throw new Error(
      `${runtime} assertion must return a boolean, number, or {pass, score, reason} object. Got instead:\n${JSON.stringify(mapped, null, 2)}`,
    );
  }

  // Handle primitives (all runtimes)
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw;
  }

  throw new Error(
    `${runtime} assertion must return a boolean, number, or GradingResult object. Got type ${typeof raw}: ${JSON.stringify(raw)}`,
  );
}

/**
 * Applies inverse logic to pass/score.
 */
function applyInverse(
  pass: boolean,
  score: number,
  inverse: boolean,
): { pass: boolean; score: number } {
  if (!inverse) {
    return { pass, score };
  }
  return {
    pass: !pass,
    score: 1 - score,
  };
}

/**
 * Processes a raw script result into a GradingResult.
 *
 * This is the shared logic for all script assertion handlers (javascript, python, ruby).
 * It handles:
 * 1. Normalizing the raw result to boolean | number | GradingResult
 * 2. Applying threshold checks for numeric scores
 * 3. Applying inverse logic for not-* assertions
 * 4. Building the final GradingResult
 *
 * When inverse logic is eventually moved to the upper layer, this function
 * will simply drop the inverse parameter and the applyInverse calls.
 */
export function processScriptResult(
  raw: unknown,
  options: ProcessScriptResultOptions,
): GradingResult {
  const { inverse, threshold, assertion, runtime, codeSnippet } = options;
  const result = normalizeResult(raw, runtime);

  const runtimeLabel = runtime === 'javascript' ? 'Custom function' : `${capitalize(runtime)} code`;
  const snippetSuffix = codeSnippet ? `\n${codeSnippet}` : '';

  // Handle boolean result
  if (typeof result === 'boolean') {
    const { pass, score } = applyInverse(result, result ? 1 : 0, inverse);
    return {
      pass,
      score,
      reason: pass
        ? 'Assertion passed'
        : `${runtimeLabel} returned ${inverse ? 'true' : 'false'}${snippetSuffix}`,
      assertion,
    };
  }

  // Handle numeric result
  if (typeof result === 'number') {
    const originalPass = threshold !== undefined ? result >= threshold : result > 0;
    const { pass, score } = applyInverse(originalPass, result, inverse);
    return {
      pass,
      score,
      reason: pass
        ? 'Assertion passed'
        : `${runtimeLabel} returned ${inverse ? 'true' : 'false'}${snippetSuffix}`,
      assertion,
    };
  }

  // Handle GradingResult
  let { pass, score = 0, reason } = result;

  // Apply inverse before threshold check
  const inverted = applyInverse(pass, score, inverse);
  pass = inverted.pass;
  score = inverted.score;

  // Apply threshold check after inverse
  if (threshold !== undefined && score < threshold) {
    pass = false;
    const scoreMessage = `${capitalize(runtime)} score ${score} is less than threshold ${threshold}`;
    reason = reason ? `${scoreMessage}: ${reason}` : scoreMessage;
  }

  return {
    ...result,
    pass,
    score,
    reason,
    assertion,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
