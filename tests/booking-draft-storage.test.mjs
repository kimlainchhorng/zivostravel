import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  bookingDraftLifetimeMs,
  clearBookingDraftSession,
  readSessionBookingDrafts,
  setBookingDraftSessionOwner,
  writeSessionBookingDrafts,
} from "../src/bookingDraftStore.ts";

const client = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/bookingDraftStore.ts", import.meta.url), "utf8");
const authoritySession = readFileSync(new URL("../src/authoritySession.ts", import.meta.url), "utf8");

const sensitiveDraft = {
  bookingReference: "TRAVEL-REF-123",
  total: 249.5,
  checkoutUrl: "https://payments.example.test/checkout/private-token",
  traveler: {
    name: "Ada Traveler",
    email: "ada@example.test",
    phone: "+15555550123",
  },
};

test("booking drafts are isolated to the current authority user and purged at session boundaries", () => {
  clearBookingDraftSession();
  setBookingDraftSessionOwner("authority-user-a");
  assert.equal(writeSessionBookingDrafts([sensitiveDraft], 1_000), true);
  assert.deepEqual(readSessionBookingDrafts(1_001), [sensitiveDraft]);

  setBookingDraftSessionOwner("authority-user-b");
  assert.deepEqual(readSessionBookingDrafts(1_001), []);

  setBookingDraftSessionOwner("authority-user-a");
  assert.equal(writeSessionBookingDrafts([sensitiveDraft], 2_000), true);
  clearBookingDraftSession();
  assert.deepEqual(readSessionBookingDrafts(2_001), []);
});

test("volatile booking drafts expire and cannot be written without an authenticated owner", () => {
  clearBookingDraftSession();
  assert.equal(writeSessionBookingDrafts([sensitiveDraft], 1_000), false);

  setBookingDraftSessionOwner("authority-user-a");
  assert.equal(writeSessionBookingDrafts([sensitiveDraft], 1_000), true);
  assert.deepEqual(readSessionBookingDrafts(1_000 + bookingDraftLifetimeMs - 1), [sensitiveDraft]);
  assert.deepEqual(readSessionBookingDrafts(1_000 + bookingDraftLifetimeMs), []);
});

test("booking reference, payment, and traveler data never use browser storage", () => {
  const draftWriterStart = client.indexOf("function writeSavedTrips");
  const draftWriterEnd = client.indexOf("function saveBookingIntent", draftWriterStart);
  const draftWriter = client.slice(draftWriterStart, draftWriterEnd);

  assert.notEqual(draftWriterStart, -1);
  assert.notEqual(draftWriterEnd, -1);
  assert.match(client, /window\.localStorage\.removeItem\(legacySavedTripsKey\)/);
  assert.match(client, /window\.sessionStorage\.removeItem\(legacySavedTripsKey\)/);
  assert.doesNotMatch(draftWriter, /localStorage|sessionStorage|JSON\.stringify/);
  assert.doesNotMatch(store, /\b(?:window\.)?(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);
  assert.doesNotMatch(store, /JSON\.stringify/);
});

test("authority sign-out and account switching are wired to the volatile-draft purge", () => {
  assert.match(authoritySession, /export function subscribeToAuthorityUserChanges/);
  assert.match(authoritySession, /currentUserId !== nextUserId/);
  assert.match(client, /subscribeToAuthorityUserChanges\(\(userId\) =>/);
  assert.match(client, /clearBookingDraftSession\(\)/);
  assert.match(client, /setBookingDraftSessionOwner\(userId\)/);
});
