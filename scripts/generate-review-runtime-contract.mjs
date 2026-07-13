import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const REVIEW_RUNTIME_CONTRACT_PATH = ".well-known/zivo-ecosystem-contract.json";

const FULL_GIT_SHA = /^[a-f0-9]{40}$/i;

export function getBuildSha(env = process.env) {
  for (const value of [env.VERCEL_GIT_COMMIT_SHA, env.GIT_COMMIT_SHA]) {
    if (typeof value === "string" && FULL_GIT_SHA.test(value)) {
      return value.toLowerCase();
    }
  }

  return null;
}

function isExplicitlyClean(value) {
  return value === "false";
}

/**
 * The contract is a Review deployment attestation, not app data. Refuse to
 * emit it unless all review provenance gates are explicitly satisfied.
 */
export function createReviewRuntimeContract(env = process.env) {
  if (env.ZIVO_ECOSYSTEM_REVIEW_MODE !== "true") return null;
  if (!isExplicitlyClean(env.ZIVO_ECOSYSTEM_GIT_DIRTY)) return null;

  const buildSha = getBuildSha(env);
  if (!buildSha) return null;

  return {
    schemaVersion: "zivo-ecosystem-runtime/v1",
    productId: "travel",
    buildSha,
    reviewMode: true,
    gitDirty: false,
    inboundContracts: [],
    outboundContracts: [
      {
        id: "travel.booking-obligation",
        version: "v1",
        to: "wallet",
      },
    ],
  };
}

/**
 * Vite emits the contract directly into dist/.well-known. On every gated-off
 * build, remove a stale artifact so Cloudflare's SPA fallback cannot advertise
 * an earlier Review deployment.
 */
export async function emitReviewRuntimeContract({ outDir, env = process.env }) {
  const artifactPath = path.join(outDir, REVIEW_RUNTIME_CONTRACT_PATH);
  const contract = createReviewRuntimeContract(env);

  if (!contract) {
    await rm(artifactPath, { force: true });
    return null;
  }

  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  return artifactPath;
}
