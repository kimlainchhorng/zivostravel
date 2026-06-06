import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const repoRoot = "/Users/kimlain/Documents/GitHub";
const sourceRepo = "zivosmedia";
const sourceRoot = join(repoRoot, sourceRepo);
const outputPath = "docs/travel-backend-inventory.md";

const scanRoots = ["src/pages", "src/hooks", "src/lib", "src/contexts", "src/data", "supabase/functions", "supabase/migrations"];

const domains = [
  {
    name: "flight",
    patterns: [/flight/i, /duffel/i, /airport/i, /travelers?/i, /flight_bookings/i, /flight_price_alerts/i],
    owner: "Zivo Travel",
    target: "Move after provider secrets, booking draft, checkout, ticketing, cancellation, and webhook flows are staged.",
  },
  {
    name: "hotel",
    patterns: [/hotel/i, /lodging/i, /lodge_/i, /room/i, /resort/i, /hotelbeds/i],
    owner: "Zivo Travel plus partner owner consoles",
    target: "Move customer booking/search to Travel; keep hotel owner operations in Software/owner console unless staff-only.",
  },
  {
    name: "rental_car",
    patterns: [/car-rental/i, /car_rental/i, /cars\//i, /\/Cars/i, /CarRental/, /rental vehicle/i, /rental_car/i],
    owner: "Zivo Travel for customer rentals; Zivo Software for fleet owner tools",
    target: "Move public rental search/checkout to Travel; keep fleet management owner tools in Software/owner console.",
  },
  {
    name: "bus",
    patterns: [/bus/i, /bus_/i, /BusBooking/i, /BusTickets/i, /BusOperator/i],
    owner: "Zivo Travel",
    target: "Good first live workflow candidate because it can be smaller than flight/hotel provider flows.",
  },
  {
    name: "checkout_payment",
    patterns: [/travel.*checkout/i, /FlightCheckout/i, /CarCheckout/i, /HotelRoomCheckout/i, /checkout/i, /stripe/i, /wallet/i, /refund/i, /receipt/i, /payout/i],
    owner: "Zivo Admin/ZivosMedia until payment cutover is reviewed",
    target: "Keep central during bridge mode; move only with Stripe secrets, webhooks, refunds, audit logs, and rollback.",
  },
  {
    name: "support_admin",
    patterns: [/travel.*support/i, /TravelBookings/i, /booking-management/i, /AdminFlight/i, /HotelAdmin/i, /CarRentalDailySheet/i, /CarRentalReceipt/i],
    owner: "Zivo Admin",
    target: "Move staff support/monitoring to Zivo-Admin; keep customer self-service in Travel.",
  },
];

const tableRegex = /\.from\(\s*["']([^"']+)["']/g;
const rpcRegex = /\.rpc\(\s*["']([^"']+)["']/g;
const functionRegex = /functions\.invoke\(\s*["']([^"']+)["']/g;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", "build", ".git"].includes(entry)) return [];
      return walk(full);
    }
    if (!/\.(ts|tsx|js|jsx|sql)$/.test(entry)) return [];
    return [full];
  });
}

function matchDomains(rel, source) {
  const objectNames = [
    ...collect(tableRegex, source),
    ...collect(rpcRegex, source),
    ...collect(functionRegex, source),
  ].join("\n");
  const imports = source
    .split("\n")
    .filter((line) => line.startsWith("import "))
    .slice(0, 80)
    .join("\n");
  const haystack = `${rel}\n${imports}\n${objectNames}`;
  return domains.filter((domain) => domain.patterns.some((pattern) => pattern.test(haystack)));
}

function collect(regex, source) {
  return [...source.matchAll(regex)].map((match) => match[1]);
}

function uniq(values) {
  return [...new Set(values)].sort();
}

const rows = [];
const objectHits = {
  tables: new Map(),
  rpcs: new Map(),
  functions: new Map(),
};

for (const scanRoot of scanRoots) {
  for (const file of walk(join(sourceRoot, scanRoot))) {
    const rel = relative(sourceRoot, file);
    const source = readFileSync(file, "utf8");
    const matchedDomains = matchDomains(rel, source);
    if (matchedDomains.length === 0) continue;

    const tables = uniq(collect(tableRegex, source));
    const rpcs = uniq(collect(rpcRegex, source));
    const functions = uniq(collect(functionRegex, source));

    for (const domain of matchedDomains) {
      rows.push({
        domain: domain.name,
        owner: domain.owner,
        target: domain.target,
        file: rel,
        tables,
        rpcs,
        functions,
      });

      for (const table of tables) addHit(objectHits.tables, table, domain.name, rel);
      for (const rpc of rpcs) addHit(objectHits.rpcs, rpc, domain.name, rel);
      for (const fn of functions) addHit(objectHits.functions, fn, domain.name, rel);
    }
  }
}

function addHit(map, object, domain, file) {
  if (!map.has(object)) map.set(object, { domains: new Set(), files: new Set() });
  map.get(object).domains.add(domain);
  map.get(object).files.add(file);
}

function renderObjectTable(title, map) {
  const rows = [...map.entries()]
    .sort((a, b) => b[1].files.size - a[1].files.size)
    .slice(0, 120)
    .map(([name, hit]) => {
      const domains = [...hit.domains].sort().join(", ");
      const files = [...hit.files].slice(0, 5).map((file) => `\`${file}\``).join(", ");
      const suffix = hit.files.size > 5 ? `, plus ${hit.files.size - 5} more` : "";
      return `| \`${name}\` | ${domains} | ${hit.files.size} | ${files}${suffix} |`;
    })
    .join("\n");

  return `## ${title}\n\n| Object | Domains | Files | First locations |\n| --- | --- | ---: | --- |\n${rows || "| None | - | 0 | - |"}\n`;
}

const domainSummary = domains
  .map((domain) => {
    const domainRows = rows.filter((row) => row.domain === domain.name);
    return `| ${domain.name} | ${domainRows.length} | ${domain.owner} | ${domain.target} |`;
  })
  .join("\n");

const candidateRows = rows
  .sort((a, b) => a.domain.localeCompare(b.domain) || a.file.localeCompare(b.file))
  .slice(0, 220)
  .map((row) => {
    const objects = [
      ...row.tables.slice(0, 4).map((name) => `table:${name}`),
      ...row.rpcs.slice(0, 3).map((name) => `rpc:${name}`),
      ...row.functions.slice(0, 3).map((name) => `fn:${name}`),
    ].join(", ");
    return `| ${row.domain} | \`${row.file}\` | ${objects || "-"} |`;
  })
  .join("\n");

const report = `# Zivo Travel Backend Inventory

Generated: 2026-06-06

Source repo scanned: \`/Users/kimlain/Documents/GitHub/zivosmedia\`

Target repo: \`/Users/kimlain/Documents/GitHub/zivostravel\`

Target Supabase project: \`xbllvmpomorawkcrtbcq\`

## Live Travel Supabase State

- Current live migration: \`zivo_travel_backend_foundation\`
- Current public tables: \`zivo_travel_backend_links\`, \`zivo_travel_service_catalog\`, \`zivo_travel_search_events\`, \`zivo_travel_partner_workflows\`, \`zivo_travel_sync_runs\`
- Current Edge Functions: none
- Current mode: bridge/staged migration, not live booking authority

## Domain Summary

| Domain | Candidate files | Owner target | Migration note |
| --- | ---: | --- | --- |
${domainSummary}

${renderObjectTable("Referenced Tables", objectHits.tables)}
${renderObjectTable("Referenced RPCs", objectHits.rpcs)}
${renderObjectTable("Referenced Edge Functions", objectHits.functions)}
## Candidate Source Files

Only the first 220 rows are shown to keep this report readable.

| Domain | File | Referenced objects |
| --- | --- | --- |
${candidateRows || "| - | - | - |"}

## Cutover Recommendation

1. Bus booking first: smallest product workflow, clear customer route, fewer provider/payment dependencies than flights.
2. Rental car customer booking next: move public search/checkout while keeping fleet owner consoles outside Travel until ownership is confirmed.
3. Hotels after provider and owner-console split is clear: customer hotel search/booking belongs in Travel; hotel/resort operations may belong in Zivo Software owner consoles.
4. Flights last among core booking products: provider secrets, ticketing, cancellation, support, compliance, and webhooks make it the highest-risk travel workflow.
5. Keep checkout, wallet, refunds, payout, and staff monitoring central until Zivo-Admin and payment audit boundaries exist.
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, report);
console.log(`Wrote ${outputPath}`);
