// ============================================================================
// ZIVO Travel — Review Hub + snapshot router (isolated, safe, non-mutating).
// Reads window.location only. Imports nothing from main.tsx.
//   /review                                  -> hub (index of all snapshots)
//   /review/snapshot/travel?path=/travel/... -> a single snapshot
// ============================================================================
import React from "react";
import { Building2, ExternalLink, Plane, ShieldCheck, Sparkles } from "lucide-react";
import "./review.css";
import { REVIEW_BUILD_INFO } from "./reviewBuildInfo";
import { TRAVEL_SNAPSHOTS, TRAVEL_SNAPSHOT_MAP } from "./travelSnapshots";
import { ReviewChrome } from "./reviewKit";

function snapshotHref(path: string) {
  return `/review/snapshot/travel?path=${encodeURIComponent(path)}`;
}

function Hub() {
  const info = REVIEW_BUILD_INFO;
  const groups = Array.from(new Set(TRAVEL_SNAPSHOTS.map((s) => s.group)));
  return (
    <div className="zreview">
      <div className="zr-banner" role="alert">
        Review snapshot · demo data only — all controls disabled. No external booking, inventory hold, payment, or
        traveler data is created.
      </div>
      <div className="zr-wrap">
        <header style={{ paddingTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="zr-empty-icon" style={{ width: 44, height: 44, borderRadius: 16 }}>
              <Plane size={24} aria-hidden />
            </span>
            <div>
              <h1 className="zr-title" style={{ fontSize: 24 }}>ZIVO Travel — Review Hub</h1>
              <p className="zr-sub">Safe, deterministic snapshots of travel screens for external review.</p>
            </div>
          </div>
          <div className="zr-meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Building2 size={12} aria-hidden /> {info.appLabel}
            </span>
            <span>branch {info.branch}</span>
            <span>commit {info.commitShort}</span>
            <span>built {info.builtAt}</span>
          </div>
          <div className="zr-hub-note">
            <ShieldCheck size={16} aria-hidden />
            <p style={{ margin: 0 }}>
              This surface imports none of the app's booking, payment, provider, or Supabase code and makes zero network
              calls. Every screen is fictional demo data with disabled controls. Payment success and booking
              confirmation are always shown as separate states.
            </p>
          </div>
          <div className="zr-hub-note" style={{ background: "#eef3f9", borderColor: "#cdd9e6", color: "#495a6e" }}>
            <Sparkles size={16} aria-hidden />
            <p style={{ margin: 0 }}>
              Snapshots marked <strong>“designed state”</strong> are not current in-app screens — the live app delegates
              checkout/payment/confirmation to Zivos Media. They are included so the full flow can be reviewed.
            </p>
          </div>
        </header>

        <main>
          {groups.map((group) => (
            <section key={group}>
              <h2 className="zr-group-title">{group}</h2>
              <ul className="zr-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {TRAVEL_SNAPSHOTS.filter((s) => s.group === group).map((s) => (
                  <li key={s.path}>
                    <a href={snapshotHref(s.path)} className="zr-hubcard zr-focus">
                      <span className="zr-hubcard-title">
                        <span>
                          {s.title}
                          {s.designed ? <span className="zr-tag" style={{ marginLeft: 6 }}>designed</span> : null}
                        </span>
                        <ExternalLink size={15} aria-hidden />
                      </span>
                      <span className="zr-hubcard-sub">{s.summary}</span>
                      <span className="zr-hubcard-path">{s.path}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>
        <div className="zr-footer">Review build · not for production · {info.commitShort}</div>
      </div>
    </div>
  );
}

function NotFoundSnapshot({ path }: { path: string }) {
  return (
    <div className="zreview">
      <div className="zr-wrap" style={{ paddingTop: 60, textAlign: "center" }}>
        <h1 className="zr-title">Snapshot not found</h1>
        <p className="zr-sub">
          No snapshot for <code>{path || "(none)"}</code>.
        </p>
        <a href="/review" className="zr-back">
          ← Back to Review Hub
        </a>
      </div>
    </div>
  );
}

export default function ReviewApp() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/review";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const isSnapshot = pathname.replace(/\/+$/, "") === "/review/snapshot/travel";

  if (!isSnapshot) return <Hub />;

  const path = new URLSearchParams(search).get("path") || "";
  const snap = TRAVEL_SNAPSHOT_MAP[path];
  if (!snap) return <NotFoundSnapshot path={path} />;

  return (
    <ReviewChrome path={snap.path} title={snap.title}>
      {snap.render()}
    </ReviewChrome>
  );
}
