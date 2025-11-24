declare class CustomApiProvider {
    id(): string;
    callApi(_prompt: string): Promise<{
        output: string;
        tokenUsage: {
            total: number;
            prompt: number;
            completion: number;
        };
    }>;
}
export default CustomApiProvider;
//# sourceMappingURL=tempCustomModule.d.ts.map