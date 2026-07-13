import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { build } from "esbuild";

import {
  createReviewRuntimeContract,
  emitReviewRuntimeContract,
  REVIEW_RUNTIME_CONTRACT_PATH,
} from "../scripts/generate-review-runtime-contract.mjs";

const FULL_SHA = "0123456789abcdef0123456789abcdef01234567";
const CONTRACT_ROUTE = "https://zivostravel.com/.well-known/zivo-ecosystem-contract.json";

let workerModulePromise;

function loadWorker() {
  workerModulePromise ||= build({
    entryPoints: [fileURLToPath(new URL("../cloudflare/worker.ts", import.meta.url))],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
  }).then(({ outputFiles }) =>
    import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`)
  );
  return workerModulePromise;
}

function reviewEnv(overrides = {}) {
  return {
    ZIVO_ECOSYSTEM_REVIEW_MODE: "true",
    ZIVO_ECOSYSTEM_GIT_DIRTY: "false",
    VERCEL_GIT_COMMIT_SHA: FULL_SHA,
    ...overrides,
  };
}

test("Travel emits the exact clean Review runtime contract", () => {
  assert.deepEqual(createReviewRuntimeContract(reviewEnv()), {
    schemaVersion: "zivo-ecosystem-runtime/v1",
    productId: "travel",
    buildSha: FULL_SHA,
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
  });
});

test("Travel accepts a lowercase-normalized full GIT_COMMIT_SHA fallback", () => {
  const contract = createReviewRuntimeContract(
    reviewEnv({
      VERCEL_GIT_COMMIT_SHA: undefined,
      GIT_COMMIT_SHA: FULL_SHA.toUpperCase(),
    }),
  );

  assert.equal(contract?.buildSha, FULL_SHA);
});

for (const [reason, env] of [
  ["Review mode is disabled", reviewEnv({ ZIVO_ECOSYSTEM_REVIEW_MODE: "false" })],
  ["Review mode is absent", reviewEnv({ ZIVO_ECOSYSTEM_REVIEW_MODE: undefined })],
  ["git state is absent", reviewEnv({ ZIVO_ECOSYSTEM_GIT_DIRTY: undefined })],
  ["git state is dirty", reviewEnv({ ZIVO_ECOSYSTEM_GIT_DIRTY: "true" })],
  ["git state is unknown", reviewEnv({ ZIVO_ECOSYSTEM_GIT_DIRTY: "1" })],
  ["SHA is abbreviated", reviewEnv({ VERCEL_GIT_COMMIT_SHA: "01234567" })],
  ["SHA is absent", reviewEnv({ VERCEL_GIT_COMMIT_SHA: undefined })],
]) {
  test(`Travel omits the contract when ${reason}`, () => {
    assert.equal(createReviewRuntimeContract(env), null);
  });
}

test("Travel generator writes the static artifact and removes it when a gate closes", async () => {
  const outDir = await mkdtemp(path.join(tmpdir(), "zivo-travel-contract-"));
  const artifactPath = path.join(outDir, REVIEW_RUNTIME_CONTRACT_PATH);

  assert.equal(await emitReviewRuntimeContract({ outDir, env: reviewEnv() }), artifactPath);
  assert.equal(
    await readFile(artifactPath, "utf8"),
    `${JSON.stringify(createReviewRuntimeContract(reviewEnv()), null, 2)}\n`,
  );

  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, "stale");
  assert.equal(
    await emitReviewRuntimeContract({
      outDir,
      env: reviewEnv({ ZIVO_ECOSYSTEM_GIT_DIRTY: "true" }),
    }),
    null,
  );
  await assert.rejects(readFile(artifactPath, "utf8"), { code: "ENOENT" });

  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, "stale");
  assert.equal(
    await emitReviewRuntimeContract({
      outDir,
      env: reviewEnv({ ZIVO_ECOSYSTEM_GIT_DIRTY: undefined }),
    }),
    null,
  );
  await assert.rejects(readFile(artifactPath, "utf8"), { code: "ENOENT" });
});

test("Cloudflare serves the contract only as a static JSON asset and fails the SPA fallback closed", async () => {
  const { default: worker } = await loadWorker();
  const baseEnv = {
    ZIVO_PLATFORM_ORIGIN: "https://zivosmedia.com",
  };
  const contract = createReviewRuntimeContract(reviewEnv());

  const spaFallback = await worker.fetch(new Request(CONTRACT_ROUTE), {
    ...baseEnv,
    ASSETS: {
      fetch: async () => new Response("<html>Travel</html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    },
  });
  assert.equal(spaFallback.status, 404);
  assert.equal(spaFallback.headers.get("cache-control"), "no-store");

  const absentCleanProvenance = await worker.fetch(new Request(CONTRACT_ROUTE), {
    ...baseEnv,
    ZIVO_ECOSYSTEM_REVIEW_MODE: "true",
    ASSETS: {
      fetch: async () => new Response(JSON.stringify(contract), {
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    },
  });
  assert.equal(absentCleanProvenance.status, 404);
  assert.equal(absentCleanProvenance.headers.get("cache-control"), "no-store");

  const response = await worker.fetch(new Request(CONTRACT_ROUTE), {
    ...baseEnv,
    ZIVO_ECOSYSTEM_REVIEW_MODE: "true",
    ZIVO_ECOSYSTEM_GIT_DIRTY: "false",
    ASSETS: {
      fetch: async () => new Response(JSON.stringify(contract), {
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(await response.json(), contract);

  const methodNotAllowed = await worker.fetch(new Request(CONTRACT_ROUTE, { method: "POST" }), {
    ...baseEnv,
    ASSETS: {
      fetch: async () => {
        throw new Error("read-only route must not request an asset for POST");
      },
    },
  });
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get("allow"), "GET, HEAD");
});
