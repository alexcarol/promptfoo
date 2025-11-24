import { RedteamGraderBase } from './base';
import type { AssertionValue, ResultSuggestion } from '../../types/index';
export declare class BolaGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
    getSuggestions({}: {
        rawPrompt: string;
        renderedValue?: AssertionValue;
    }): ResultSuggestion[];
}
//# sourceMappingURL=bola.d.ts.map