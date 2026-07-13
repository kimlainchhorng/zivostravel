import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  clearSupportTicketSession,
  readSessionSupportTickets,
  setSupportTicketSessionOwner,
  writeSessionSupportTickets,
} from "../src/supportTicketStore.ts";

const client = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/supportTicketStore.ts", import.meta.url), "utf8");
const authoritySession = readFileSync(new URL("../src/authoritySession.ts", import.meta.url), "utf8");

const privateTicket = {
  reference: "zts_private_123",
  summary: "My passport name does not match the ticket.",
  customer: "Ada Traveler",
  bookingReference: "ztb_private_456",
};

test("support tickets are isolated to the current authority user and purged at session boundaries", () => {
  clearSupportTicketSession();
  setSupportTicketSessionOwner("authority-user-a");
  writeSessionSupportTickets([privateTicket]);
  assert.deepEqual(readSessionSupportTickets(), [privateTicket]);

  setSupportTicketSessionOwner("authority-user-b");
  assert.deepEqual(readSessionSupportTickets(), []);

  setSupportTicketSessionOwner("authority-user-a");
  writeSessionSupportTickets([privateTicket]);
  clearSupportTicketSession();
  assert.deepEqual(readSessionSupportTickets(), []);
});

test("support-ticket PII never uses browser persistence and historical values are removed", () => {
  const supportReaderStart = client.indexOf("function readSupportTickets");
  const supportReaderEnd = client.indexOf("function writeSupportTickets", supportReaderStart);
  const supportWriterStart = supportReaderEnd;
  const supportWriterEnd = client.indexOf("function saveSupportTicket", supportWriterStart);
  const reader = client.slice(supportReaderStart, supportReaderEnd);
  const writer = client.slice(supportWriterStart, supportWriterEnd);

  assert.notEqual(supportReaderStart, -1);
  assert.notEqual(supportWriterStart, -1);
  assert.notEqual(supportWriterEnd, -1);
  assert.match(client, /window\.localStorage\.removeItem\(supportTicketsKey\)/);
  assert.match(client, /window\.sessionStorage\.removeItem\(supportTicketsKey\)/);
  assert.doesNotMatch(reader, /localStorage|sessionStorage|JSON\.(?:parse|stringify)/);
  assert.doesNotMatch(writer, /localStorage|sessionStorage|JSON\.(?:parse|stringify)/);
  assert.doesNotMatch(store, /\b(?:window\.)?(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);
  assert.doesNotMatch(store, /JSON\.stringify/);
});

test("authority identity transitions clear volatile support tickets", () => {
  assert.match(authoritySession, /export function subscribeToAuthorityUserChanges/);
  assert.match(authoritySession, /currentUserId !== nextUserId/);
  assert.match(client, /subscribeToAuthorityUserChanges\(\(userId\) =>/);
  assert.match(client, /clearSupportTicketSession\(\)/);
  assert.match(client, /setSupportTicketSessionOwner\(userId\)/);
  assert.match(client, /window\.dispatchEvent\(new Event\(supportTicketsEvent\)\)/);
  assert.doesNotMatch(client, /window\.addEventListener\("storage", refreshSupportTickets\)/);
});
