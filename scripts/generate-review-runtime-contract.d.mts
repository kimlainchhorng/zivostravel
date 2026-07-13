export type ReviewRuntimeContractEnv = Record<string, string | undefined>;

export interface ReviewRuntimeContract {
  schemaVersion: "zivo-ecosystem-runtime/v1";
  productId: "travel";
  buildSha: string;
  reviewMode: true;
  gitDirty: false;
  inboundContracts: [];
  outboundContracts: Array<{
    id: "travel.booking-obligation";
    version: "v1";
    to: "wallet";
  }>;
}

export const REVIEW_RUNTIME_CONTRACT_PATH: ".well-known/zivo-ecosystem-contract.json";

export function getBuildSha(env?: ReviewRuntimeContractEnv): string | null;
export function createReviewRuntimeContract(env?: ReviewRuntimeContractEnv): ReviewRuntimeContract | null;
export function emitReviewRuntimeContract(options: {
  outDir: string;
  env?: ReviewRuntimeContractEnv;
}): Promise<string | null>;
