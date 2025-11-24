export interface MessageRole {
    role: 'user' | 'assistant';
    content: string;
}
export declare class ConversationRelevancyTemplate {
    static generateVerdicts(slidingWindow: MessageRole[]): string;
    static generateReason(score: number, irrelevancies: string[]): string;
}
//# sourceMappingURL=conversationRelevancyTemplate.d.ts.map