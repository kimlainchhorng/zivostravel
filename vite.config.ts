import { defineConfig, loadEnv, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react";
import { emitReviewRuntimeContract } from "./scripts/generate-review-runtime-contract.mjs";

function reviewRuntimeContractPlugin(env: Record<string, string | undefined>) {
  let outDir = "dist";

  return {
    name: "zivo-travel-review-runtime-contract",
    apply: "build" as const,
    configResolved(config: ResolvedConfig) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      await emitReviewRuntimeContract({ outDir, env });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Read non-VITE build provenance only in the Node build configuration. It is
  // never exposed to the browser bundle.
  const buildEnv = loadEnv(mode, ".", "");

  return {
    plugins: [react(), reviewRuntimeContractPlugin(buildEnv)],
    publicDir: false,
    server: {
      port: 5175,
    },
  };
});
