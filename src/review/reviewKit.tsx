// ============================================================================
// ZIVO Travel — Isolated Review Kit (self-contained, safe, non-mutating).
// Imports ONLY React + lucide-react + the scoped review stylesheet.
// It imports NOTHING from main.tsx (no /api/travel fetchers, no engine/bridge
// helpers, no booking/payment code), so it makes zero network calls.
// Every action control is disabled; all data is fictional.
// ============================================================================
import React, { useEffect } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Info,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import "./review.css";
import { REVIEW_BUILD_INFO } from "./reviewBuildInfo";

export type Tone = "neutral" | "positive" | "pending" | "critical" | "info";

export function Pill({ tone = "neutral", icon: Icon, children }: { tone?: Tone; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <span className={`zr-pill zr-pill--${tone}`}>
      {Icon ? <Icon size={13} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`zr-card ${className}`}>{children}</div>;
}

export function Row({
  label,
  value,
  strong,
  valueClass,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="zr-row">
      <span className="zr-row-label">{label}</span>
      <span className={`zr-row-value ${strong ? "zr-strong" : ""} ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

export function DisabledButton({
  children,
  variant = "primary",
  icon: Icon,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  icon?: LucideIcon;
}) {
  return (
    <button type="button" disabled aria-disabled="true" title="Disabled in review — demo only" className={`zr-btn zr-btn--${variant}`}>
      {Icon ? <Icon size={16} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Note({ children, tone = "info", icon: Icon = Info }: { children: React.ReactNode; tone?: Tone; icon?: LucideIcon }) {
  const cls = tone === "neutral" ? "info" : tone;
  return (
    <div role="note" className={`zr-note zr-note--${cls}`}>
      <Icon size={16} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function ScreenTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header>
      <h2 className="zr-h2">{children}</h2>
      {sub ? <p className="zr-sub">{sub}</p> : null}
    </header>
  );
}

export function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="zr-stat">
      <span className="zr-label">{label}</span>
      <p className={`zr-stat-value ${positive ? "is-positive" : ""}`}>{value}</p>
    </div>
  );
}

export function Steps({ steps }: { steps: Array<{ label: string; icon?: LucideIcon }> }) {
  return (
    <div className="zr-steps">
      {steps.map((s, i) => (
        <span key={i} className="zr-step">
          {s.icon ? <s.icon size={12} aria-hidden /> : null}
          {s.label}
        </span>
      ))}
    </div>
  );
}

export function ResultCard({
  icon: Icon,
  title,
  provider,
  detail,
  price,
  badge,
  tags,
}: {
  icon: LucideIcon;
  title: string;
  provider: string;
  detail: string;
  price: string;
  badge?: string;
  tags?: string[];
}) {
  return (
    <div className="zr-result">
      <div className="zr-result-thumb">
        <Icon size={22} aria-hidden />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div>
            <p className="zr-strong" style={{ margin: 0, fontSize: 14 }}>
              {title}
            </p>
            <p className="zr-sub" style={{ margin: 0 }}>
              {provider} · {detail}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="zr-strong" style={{ margin: 0, fontSize: 15 }}>
              {price}
            </p>
            {badge ? <span className="zr-pill zr-pill--info" style={{ marginTop: 4 }}>{badge}</span> : null}
          </div>
        </div>
        {tags && tags.length > 0 ? (
          <div className="zr-tags">
            {tags.map((t) => (
              <span key={t} className="zr-tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PaymentBookingState — the crux requirement for Travel.
// Payment status and booking status are ALWAYS rendered as two separate,
// clearly-labeled rows, so a successful payment is never shown as a confirmed
// booking. Provider confirmation is what confirms a booking, not payment.
// ---------------------------------------------------------------------------
export type PayStatus = "not-started" | "pending" | "succeeded" | "failed" | "refund-pending" | "refunded";
export type BookStatus = "draft" | "not-confirmed" | "confirming" | "confirmed" | "cancelled";

const PAY_META: Record<PayStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  "not-started": { label: "Not started", tone: "neutral", icon: Clock },
  pending: { label: "Pending", tone: "pending", icon: Clock },
  succeeded: { label: "Succeeded", tone: "positive", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "critical", icon: AlertTriangle },
  "refund-pending": { label: "Refund pending", tone: "pending", icon: Clock },
  refunded: { label: "Refunded", tone: "info", icon: CheckCircle2 },
};
const BOOK_META: Record<BookStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  draft: { label: "Draft only", tone: "neutral", icon: ReceiptText },
  "not-confirmed": { label: "Not confirmed", tone: "pending", icon: Clock },
  confirming: { label: "Awaiting provider", tone: "pending", icon: Clock },
  confirmed: { label: "Confirmed by provider", tone: "positive", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "critical", icon: AlertTriangle },
};

export function PaymentBookingState({
  payment,
  booking,
  note = true,
}: {
  payment: PayStatus;
  booking: BookStatus;
  note?: boolean;
}) {
  const p = PAY_META[payment];
  const b = BOOK_META[booking];
  return (
    <div>
      <div className="zr-pbstate">
        <div className="zr-pbrow">
          <div>
            <span className="zr-pbrow-title">
              <CreditCard size={16} aria-hidden /> Payment
            </span>
            <p className="zr-pbrow-sub">Handled on Zivos Media checkout</p>
          </div>
          <Pill tone={p.tone} icon={p.icon}>
            {p.label}
          </Pill>
        </div>
        <div className="zr-pbrow">
          <div>
            <span className="zr-pbrow-title">
              <ReceiptText size={16} aria-hidden /> Booking
            </span>
            <p className="zr-pbrow-sub">Confirmed by the travel provider</p>
          </div>
          <Pill tone={b.tone} icon={b.icon}>
            {b.label}
          </Pill>
        </div>
      </div>
      {note ? (
        <Note tone="info" icon={ShieldCheck}>
          Payment status and booking status are tracked <strong>separately</strong>. A succeeded payment does{" "}
          <strong>not</strong> by itself confirm the booking — confirmation comes from the provider.
        </Note>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cross-app ZIVO Wallet connection (safe, disabled). Env-configured review
// link or an inert placeholder. No deep link auto-pays.
// ---------------------------------------------------------------------------
export type WalletState =
  | "pay"
  | "open"
  | "payment-pending"
  | "payment-confirmed"
  | "payment-failed"
  | "refund-pending"
  | "transfer-status";

const WALLET_REVIEW_LINK: string =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_REVIEW_WALLET_URL as string)) || "#review-placeholder";

const WALLET_META: Record<WalletState, { title: string; body: string; tone: Tone; icon: LucideIcon; pill: string }> = {
  pay: {
    title: "Pay with ZIVO Wallet",
    body: "Starts a wallet payment for this trip. The amount is sent to the wallet for approval — it is never treated as final here.",
    tone: "info",
    icon: Wallet,
    pill: "Disabled",
  },
  open: {
    title: "Open ZIVO Wallet",
    body: "Opens the ZIVO Wallet in a new context. No amount is passed and nothing is charged.",
    tone: "info",
    icon: ExternalLink,
    pill: "Link only",
  },
  "payment-pending": {
    title: "Payment pending",
    body: "The wallet is processing the payment. The booking stays unconfirmed until the provider confirms.",
    tone: "pending",
    icon: Clock,
    pill: "Pending",
  },
  "payment-confirmed": {
    title: "Payment confirmed",
    body: "The wallet confirmed the payment. This is a payment result only — it does not confirm the booking.",
    tone: "positive",
    icon: CheckCircle2,
    pill: "Confirmed",
  },
  "payment-failed": {
    title: "Payment failed",
    body: "The wallet reported a failed payment. No funds moved. The traveler can retry from the wallet.",
    tone: "critical",
    icon: AlertTriangle,
    pill: "Failed",
  },
  "refund-pending": {
    title: "Refund pending",
    body: "A refund was requested and is awaiting wallet processing. Not yet settled.",
    tone: "pending",
    icon: Clock,
    pill: "Pending",
  },
  "transfer-status": {
    title: "Transfer status",
    body: "Whether funds reached the destination balance. Distinct from a completed payout to a bank.",
    tone: "info",
    icon: Landmark,
    pill: "Info",
  },
};

export function WalletConnect({ state }: { state: WalletState }) {
  const s = WALLET_META[state];
  return (
    <Card className="zr-card--tight">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span className="zr-pbrow-title">
          <s.icon size={16} aria-hidden /> {s.title}
        </span>
        <Pill tone={s.tone} icon={s.icon}>
          {s.pill}
        </Pill>
      </div>
      <p className="zr-sub" style={{ margin: 0 }}>
        {s.body}
      </p>
      <div className="zr-btn-row" style={{ marginTop: 10 }}>
        <DisabledButton variant="primary" icon={Wallet}>
          Pay with ZIVO Wallet
        </DisabledButton>
        <a
          href={WALLET_REVIEW_LINK}
          onClick={(e) => e.preventDefault()}
          aria-disabled="true"
          title="Disabled in review — demo only"
          className="zr-btn zr-btn--outline"
        >
          Open ZIVO Wallet
        </a>
      </div>
      <p className="zr-flow-note">No deep link auto-pays. No client-supplied amount is authoritative — the wallet decides.</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Phone frame + tab bar
// ---------------------------------------------------------------------------
export function TabBar({ active }: { active?: "search" | "trips" | "deals" | "wallet" | "support" }) {
  const items: Array<{ id: string; label: string; icon: LucideIcon }> = [
    { id: "search", label: "Search", icon: ReceiptText },
    { id: "trips", label: "Trips", icon: CheckCircle2 },
    { id: "deals", label: "Deals", icon: Info },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "support", label: "Support", icon: ShieldCheck },
  ];
  return (
    <nav aria-label="Primary (demo, disabled)" className="zr-tabbar">
      {items.map((it) => {
        const on = it.id === active;
        return (
          <span key={it.id} aria-current={on ? "page" : undefined} className={`zr-tab ${on ? "is-active" : ""}`}>
            <it.icon size={18} aria-hidden />
            {it.label}
          </span>
        );
      })}
    </nav>
  );
}

export function PhoneFrame({
  children,
  statusLabel,
  tab,
}: {
  children: React.ReactNode;
  statusLabel?: string;
  tab?: React.ComponentProps<typeof TabBar>["active"];
}) {
  return (
    <div className="zr-phone">
      <div className="zr-screen">
        <div className="zr-statusbar">
          <span>9:41</span>
          <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{statusLabel}</span>
          <span>100%</span>
        </div>
        <div className="zr-body">{children}</div>
        {tab ? <TabBar active={tab} /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewChrome — banner, toolbar, meta stamp, footer. Travel is light-only.
// ---------------------------------------------------------------------------
export function ReviewChrome({ path, title, children }: { path: string; title: string; children: React.ReactNode }) {
  const info = REVIEW_BUILD_INFO;
  useEffect(() => {
    document.title = `${title} · ${info.appLabel} review`;
  }, [title, info.appLabel]);

  return (
    <div className="zreview">
      <div className="zr-banner" role="alert">
        Review snapshot · demo data only — all controls are disabled. No external booking, inventory hold, payment, or
        traveler data is created.
      </div>
      <div className="zr-wrap">
        <div className="zr-toolbar">
          <div style={{ minWidth: 0 }}>
            <a href="/review" className="zr-back">
              ← All snapshots
            </a>
            <h1 className="zr-title">{title}</h1>
            <p className="zr-path">{path}</p>
          </div>
        </div>
        <div className="zr-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Building2 size={12} aria-hidden /> {info.appLabel}
          </span>
          <span>branch {info.branch}</span>
          <span>commit {info.commitShort}</span>
          <span>built {info.builtAt}</span>
          <span className="zr-live">Review build · not for production</span>
        </div>
        <main style={{ paddingBottom: 24 }}>{children}</main>
        <div className="zr-footer">Review build · light theme (Travel app is light-only) · English (Khmer not localized in Travel) · {info.commitShort}</div>
      </div>
    </div>
  );
}

export {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Wallet,
};
