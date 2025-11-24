import type { Prompt } from '../../types/index';
/**
 * Processes a YAML file to extract prompts.
 * This function reads a YAML file, parses it, and maps each entry to a `Prompt` object.
 * Each prompt is labeled with the file path and the YAML content.
 * Any file:// references within the YAML content are recursively resolved.
 *
 * @param filePath - The path to the YAML file.
 * @param prompt - The raw prompt data, used for labeling.
 * @returns An array of `Prompt` objects extracted from the YAML file.
 * @throws Will throw an error if the file cannot be read or parsed.
 */
export declare function processYamlFile(filePath: string, prompt: Partial<Prompt>): Prompt[];
//# sourceMappingURL=yaml.d.ts.map