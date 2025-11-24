import type { GradingResult } from './types/index';
type PiQuestion = {
    question: string;
};
type PiScoringSpec = PiQuestion[];
type RemotePiScoringPayload = {
    llm_input: string;
    llm_output: string;
    scoring_spec: PiScoringSpec;
};
export declare function doRemoteScoringWithPi(payload: RemotePiScoringPayload, passThreshold?: number): Promise<Omit<GradingResult, 'assertion'>>;
export {};
//# sourceMappingURL=remoteScoring.d.ts.map