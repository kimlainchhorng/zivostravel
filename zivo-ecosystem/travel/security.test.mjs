// @ts-check
/**
 * ZIVO Travel — security coverage: RLS, secret exposure, deep-link authorization.
 * Repo-grounded + offline. Reads this repo's supabase/migrations and tracked
 * files. No live Supabase, no network. Run:
 *   node --test zivo-ecosystem/travel/*.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { parseDeepLink, authorizeDeepLink } from '../deeplink.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..'); // <repo>/zivo-ecosystem/travel -> <repo>
const MIGRATIONS = path.join(REPO, 'supabase', 'migrations');
const hasMigrations = fs.existsSync(MIGRATIONS);

function loadMigrationSql() {
  return fs.readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'))
    .join('\n');
}

// ------------------------------------------------------------------- RLS
test('RLS: every created public table has RLS enabled; none disabled', { skip: !hasMigrations && 'no supabase/migrations in this repo' }, () => {
  const sql = loadMigrationSql().toLowerCase();
  const created = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map((m) => m[1]);
  const rlsOn = new Set([...sql.matchAll(/alter table public\.(\w+)\s+enable row level security/g)].map((m) => m[1]));
  assert.ok(created.length > 0, 'expected at least one created public table');
  for (const t of created) {
    assert.ok(rlsOn.has(t), `table public.${t} must ENABLE row level security`);
  }
  assert.equal(/disable row level security/.test(sql), false, 'no table may DISABLE RLS');
});

test('RLS: no SECURITY DEFINER function is granted to anon (0 anon-privileged fns)', { skip: !hasMigrations && 'no supabase/migrations in this repo' }, () => {
  const sql = loadMigrationSql().toLowerCase();
  // any `grant execute on function ... to ... anon ...` is a red flag for a
  // privileged (security definer) function reachable by the anon role.
  const anonGrants = [...sql.matchAll(/grant\s+execute\s+on\s+function[^;]*?\bto\b[^;]*?\banon\b/g)];
  assert.equal(anonGrants.length, 0, `expected 0 anon function grants, found ${anonGrants.length}`);
});

// -------------------------------------------------------- secret exposure
test('secret exposure: no concrete secret VALUE in tracked files', () => {
  let files;
  try {
    files = execFileSync('git', ['-C', REPO, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return; // not a git repo in this context — nothing to scan
  }
  // Concrete secret VALUE patterns (not env-var names like SUPABASE_SERVICE_ROLE_KEY).
  const VALUE_PATTERNS = [
    /\bsk_live_[A-Za-z0-9]{20,}\b/,                        // Stripe live secret
    /\bsk_test_[A-Za-z0-9]{20,}\b/,                        // Stripe test secret
    /\bwhsec_[A-Za-z0-9]{20,}\b/,                          // Stripe webhook secret
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/, // full JWT (3 segments)
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,   // private key
  ];
  const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.sql', '.yml', '.yaml', '.toml', '.sh', '.html', '.css', '.env']);
  const offenders = [];
  for (const rel of files) {
    if (rel.endsWith('.md')) continue;
    if (rel.includes('node_modules/') || rel.startsWith('dist/') || rel.startsWith('build/')) continue;
    if (rel === 'package-lock.json' || rel.endsWith('bun.lockb')) continue;
    // exclude the contract package's own scanner/detection code + these tests
    if (rel.startsWith('zivo-ecosystem/')) continue;
    const ext = path.extname(rel);
    const isEnv = path.basename(rel).startsWith('.env');
    if (!SCAN_EXT.has(ext) && !isEnv) continue;
    let text;
    try { text = fs.readFileSync(path.join(REPO, rel), 'utf8'); } catch { continue; }
    for (const re of VALUE_PATTERNS) {
      if (re.test(text)) { offenders.push(rel + ' :: ' + re.source); break; }
    }
  }
  assert.deepEqual(offenders, [], 'committed secret values found: ' + offenders.join(', '));
});

// -------------------------------------------------- deep-link authorization
test('deep-link: a travel booking link is read-only, auth+ownership gated, never auto-pay', () => {
  const link = parseDeepLink('travel', '/bookings/bk_1');
  assert.equal(link.class, 'read-entity');
  assert.equal(authorizeDeepLink(link, { authenticated: false, ownsEntity: true }), false);
  assert.equal(authorizeDeepLink(link, { authenticated: true, ownsEntity: false }), false);
  assert.equal(authorizeDeepLink(link, { authenticated: true, ownsEntity: true }), true);
  assert.throws(() => parseDeepLink('travel', '/bookings/bk_1?intent=pay'), /forbidden intent/);
});
