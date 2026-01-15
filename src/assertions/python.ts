import { runPythonCode } from '../python/wrapper';
import { type GradingResult, isGradingResult } from '../types/index';
import { mapSnakeCaseToCamelCase } from '../util/caseMapping';
import invariant from '../util/invariant';

import type { AssertionParams } from '../types/index';

export const handlePython = async ({
  assertion,
  renderedValue,
  valueFromScript,
  assertionValueContext,
  output,
  inverse,
}: AssertionParams): Promise<GradingResult> => {
  invariant(typeof renderedValue === 'string', 'python assertion must have a string value');
  let pass;
  let score;
  try {
    let result: string | number | boolean | object | GradingResult | undefined;
    if (typeof valueFromScript === 'undefined') {
      const isMultiline = renderedValue.includes('\n');
      let indentStyle = '    ';
      if (isMultiline) {
        // Detect the indentation style of the first indented line
        const match = renderedValue.match(/^(?!\s*$)\s+/m);
        if (match) {
          indentStyle = match[0];
        }
      }

      const pythonScript = `import json

def main(output, context):
${
  isMultiline
    ? renderedValue
        .split('\n')
        .map((line) => `${indentStyle}${line}`)
        .join('\n')
    : `    return ${renderedValue}`
}
`;
      result = await runPythonCode(pythonScript, 'main', [output, assertionValueContext]);
    } else {
      result = valueFromScript;
    }

    if (
      (typeof result === 'boolean' && result) ||
      (typeof result === 'string' && result.toLowerCase() === 'true')
    ) {
      pass = !inverse; // true becomes false when inverted
      score = inverse ? 0.0 : 1.0;
    } else if (
      (typeof result === 'boolean' && !result) ||
      (typeof result === 'string' && result.toLowerCase() === 'false')
    ) {
      pass = inverse; // false becomes true when inverted
      score = inverse ? 1.0 : 0.0;
    } else if (typeof result === 'string' && result.startsWith('{')) {
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err} when parsing result: ${result}`);
      }
      if (!isGradingResult(parsed)) {
        throw new Error(
          `Python assertion must return a boolean, number, or {pass, score, reason} object. Got instead: ${result}`,
        );
      }
      if (inverse) {
        const invertedScore = 1 - (parsed.score ?? 0);
        return {
          ...parsed,
          pass: !parsed.pass,
          score: invertedScore,
          assertion,
        };
      }
      return { ...parsed, assertion };
    } else if (typeof result === 'object') {
      const obj = result;

      // Support snake_case keys from Python dataclass (recursively)
      const mappedObj = mapSnakeCaseToCamelCase(obj);

      if (!isGradingResult(mappedObj)) {
        throw new Error(
          `Python assertion must return a boolean, number, or {pass, score, reason} object. Got instead:\n${JSON.stringify(
            mappedObj,
            null,
            2,
          )}`,
        );
      }
      const pythonGradingResult = mappedObj as Omit<GradingResult, 'assertion'>;

      // Apply inverse before threshold check
      if (inverse) {
        pythonGradingResult.pass = !pythonGradingResult.pass;
        pythonGradingResult.score = 1 - (pythonGradingResult.score ?? 0);
      }

      if (assertion.threshold !== undefined && pythonGradingResult.score < assertion.threshold) {
        pythonGradingResult.pass = false;
        const scoreMessage = `Python score ${pythonGradingResult.score} is less than threshold ${assertion.threshold}`;
        pythonGradingResult.reason = pythonGradingResult.reason
          ? `${scoreMessage}: ${pythonGradingResult.reason}`
          : scoreMessage;
      }
      return {
        ...pythonGradingResult,
        assertion,
      };
    } else {
      score = Number.parseFloat(String(result));
      if (Number.isNaN(score)) {
        throw new Error(
          `Python assertion must return a boolean, number, or {pass, score, reason} object. Instead got:\n${result}`,
        );
      }
      // Apply inverse to numeric score
      if (inverse) {
        score = 1 - score;
      }
      pass = assertion.threshold !== undefined ? score >= assertion.threshold : score > 0;
    }
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `Python code execution failed: ${(err as Error).message}`,
      assertion,
    };
  }
  return {
    pass,
    score,
    reason: pass
      ? 'Assertion passed'
      : `Python code returned ${inverse ? 'true' : 'false'}\n${assertion.value}`,
    assertion,
  };
};
