import { OpenAiGenericProvider } from '.';
import type { ApiModerationProvider, ProviderModerationResponse } from '../../types/index';
type OpenAIModerationModelId = string;
export type TextInput = {
    type: 'text';
    text: string;
};
export type ImageInput = {
    type: 'image_url';
    image_url: {
        url: string;
    };
};
type ModerationInput = string | (TextInput | ImageInput)[];
export declare function isTextInput(input: TextInput | ImageInput): input is TextInput;
export declare function isImageInput(input: TextInput | ImageInput): input is ImageInput;
interface OpenAIModerationConfig {
    apiKey?: string;
    headers?: Record<string, string>;
    passthrough?: Record<string, any>;
}
export declare function supportsImageInput(modelName: string): boolean;
export declare function formatModerationInput(content: string | (TextInput | ImageInput)[], supportsImages: boolean): ModerationInput;
export declare class OpenAiModerationProvider extends OpenAiGenericProvider implements ApiModerationProvider {
    static MODERATION_MODELS: {
        id: string;
        maxTokens: number;
        capabilities: string[];
    }[];
    static MODERATION_MODEL_IDS: string[];
    constructor(modelName?: OpenAIModerationModelId, options?: {
        config?: OpenAIModerationConfig;
        id?: string;
        env?: any;
    });
    callModerationApi(_userPrompt: string, assistantResponse: string | (TextInput | ImageInput)[]): Promise<ProviderModerationResponse>;
}
export {};
//# sourceMappingURL=moderation.d.ts.map