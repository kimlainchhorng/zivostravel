#!/usr/bin/env node
// Creates the Cloudflare Pages Review artifact without invoking the production
// Travel app build. Only review-static HTML/CSS/headers are copied to dist-review.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);
const out = join(repoRoot, "dist-review");

function resolveSha() {
  const supplied = (process.env.CF_PAGES_COMMIT_SHA || process.env.REVIEW_SHA || "").trim().toLowerCase();
  if (supplied) {
    if (!/^[0-9a-f]{40}$/.test(supplied)) throw new Error("CF_PAGES_COMMIT_SHA must be a 40-character lowercase SHA.");
    return supplied;
  }
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("Unable to resolve a 40-character git SHA.");
  return sha;
}

const sha = resolveSha();
const builtAt = (process.env.REVIEW_BUILD_TIME || new Date().toISOString()).trim();
rmSync(out, { recursive: true, force: true });
cpSync(here, out, {
  recursive: true,
  filter(source) {
    return !["README.md", "scan.sh", "build.mjs"].includes(basename(source));
  },
});

const indexPath = join(out, "index.html");
if (!existsSync(indexPath)) throw new Error("review-static/index.html is missing.");
let html = readFileSync(indexPath, "utf8");
const shaSlot = /(<code id="sha" data-cf-sha=")[^"]*("[^>]*>)[^<]*(<\/code>)/;
const timestampSlot = /(<code id="ts">)[^<]*(<\/code>)/;
if (!shaSlot.test(html) || !timestampSlot.test(html)) throw new Error("Review provenance slots are missing from index.html.");
html = html.replace(shaSlot, `$1${sha}$2${sha}$3`).replace(timestampSlot, `$1${builtAt}$2`);
if (html.includes("__CF_PAGES_COMMIT_SHA")) throw new Error("Review SHA placeholder remained after generation.");
writeFileSync(indexPath, html);

console.log(`Travel Review static build → dist-review/`);
console.log(`  commit: ${sha}`);
console.log(`  built: ${builtAt}`);
