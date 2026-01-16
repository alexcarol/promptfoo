import { runPythonCode } from '../python/wrapper';
import type { AssertionParams, GradingResult } from '../types/index';
import invariant from '../util/invariant';
import { processScriptResult } from './processScriptResult';

export const handlePython = async ({
  assertion,
  renderedValue,
  valueFromScript,
  assertionValueContext,
  output,
  inverse,
}: AssertionParams): Promise<GradingResult> => {
  invariant(typeof renderedValue === 'string', 'python assertion must have a string value');

  try {
    let raw: unknown;

    if (typeof valueFromScript !== 'undefined') {
      // Result from file:// execution
      raw = valueFromScript;
    } else {
      // Inline code - build and execute Python script
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
      raw = await runPythonCode(pythonScript, 'main', [output, assertionValueContext]);
    }

    return processScriptResult(raw, {
      inverse,
      threshold: assertion.threshold,
      assertion,
      runtime: 'python',
      codeSnippet: String(assertion.value),
    });
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `Python code execution failed: ${(err as Error).message}`,
      assertion,
    };
  }
};
