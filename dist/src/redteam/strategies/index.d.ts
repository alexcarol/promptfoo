import type { RedteamStrategyObject } from '../../types/index';
import type { Strategy } from './types';
export type { Strategy };
export declare const Strategies: Strategy[];
export declare function validateStrategies(strategies: RedteamStrategyObject[]): Promise<void>;
export declare function loadStrategy(strategyPath: string): Promise<Strategy>;
//# sourceMappingURL=index.d.ts.map