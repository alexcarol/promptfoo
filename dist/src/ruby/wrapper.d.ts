/**
 * Executes Ruby code by writing it to a temporary file
 * @param {string} code - The Ruby code to execute.
 * @param {string} method - The method name to call in the Ruby script.
 * @param {(string | object | undefined)[]} args - The list of arguments to pass to the Ruby method.
 * @returns {Promise<any>} - The result from executing the Ruby code.
 */
export declare function runRubyCode(code: string, method: string, args: (string | object | undefined)[]): Promise<any>;
//# sourceMappingURL=wrapper.d.ts.map