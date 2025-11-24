/**
 * Interface for providers that need cleanup on process exit.
 */
interface CleanupProvider {
    shutdown(): Promise<void>;
}
/**
 * Global registry of Python providers for cleanup on process exit.
 * Ensures no zombie Python processes are left running.
 */
declare class ProviderRegistry {
    private providers;
    private shutdownRegistered;
    register(provider: CleanupProvider): void;
    unregister(provider: CleanupProvider): void;
    private registerShutdownHandlers;
    shutdownAll(): Promise<void>;
}
export declare const providerRegistry: ProviderRegistry;
export {};
//# sourceMappingURL=providerRegistry.d.ts.map