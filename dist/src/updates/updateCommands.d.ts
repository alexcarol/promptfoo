/**
 * Shared logic for generating update commands based on environment
 */
export interface UpdateCommandOptions {
    selfHosted: boolean;
    isNpx: boolean;
}
export interface UpdateCommandResult {
    primary: string;
    alternative: string | null;
    commandType: 'docker' | 'npx' | 'npm';
}
export declare function getUpdateCommands(options: UpdateCommandOptions): UpdateCommandResult;
export declare function getUpdateCommandLabel(isNpx: boolean, isPrimary: boolean): string;
//# sourceMappingURL=updateCommands.d.ts.map