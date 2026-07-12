// ============================================================================
// ZIVO Travel — deterministic review snapshots (fictional demo data only).
// Pure render functions. No network, no /api/travel calls, no bridge/engine
// helpers, no booking/payment side effects. All action controls are disabled.
//
// The real app terminates at a booking DRAFT and hands checkout/payment off to
// Zivos Media; it never shows an in-app "paid = confirmed" screen. These
// snapshots preserve that separation. States the real app does not render
// in-app today (property detail, room selection, price-changed, payment/booking
// pending, confirmed, cancellation, refund, offline, error) are marked as
// "designed state" so the review is honest about current vs. proposed UI.
// ============================================================================
import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CloudOff,
  CreditCard,
  Hotel,
  MapPin,
  Plane,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Card,
  DisabledButton,
  Note,
  PaymentBookingState,
  PhoneFrame,
  Pill,
  ResultCard,
  Row,
  ScreenTitle,
  Stat,
  Steps,
  WalletConnect,
} from "./reviewKit";

export type Snapshot = {
  path: string;
  title: string;
  group: string;
  summary: string;
  designed?: boolean; // true = not a current in-app screen; a proposed/review state
  render: () => React.ReactNode;
};

function DesignedTag() {
  return (
    <Note tone="info" icon={Sparkles}>
      Designed review state — the live app currently delegates this step (checkout, payment, and final confirmation run
      on Zivos Media). Shown here so the flow and its <strong>payment ≠ booking</strong> separation can be reviewed.
    </Note>
  );
}

const HOTEL_TAGS = ["Breakfast", "Pool", "Pay later"];

export const TRAVEL_SNAPSHOTS: Snapshot[] = [
  // ---- Discover --------------------------------------------------------
  {
    path: "/travel/home",
    title: "Home",
    group: "Discover",
    summary: "Landing with search entry, popular routes and trip products.",
    render: () => (
      <PhoneFrame statusLabel="ZIVO Travel" tab="search">
        <ScreenTitle sub="Flights, hotels, cars & bus across Cambodia and beyond.">Where will you go next?</ScreenTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              { icon: Plane, label: "Flights", on: true },
              { icon: Hotel, label: "Hotels", on: false },
              { icon: Car, label: "Cars", on: false },
              { icon: Bus, label: "Bus", on: false },
            ].map((t) => (
              <span key={t.label} className={`zr-pill ${t.on ? "zr-pill--info" : "zr-pill--neutral"}`}>
                <t.icon size={13} aria-hidden />
                {t.label}
              </span>
            ))}
          </div>
          <Row label="From" value="Phnom Penh (PNH)" />
          <Row label="To" value="Siem Reap (REP)" />
          <Row label="Dates" value="Jun 15 – Jun 18, 2026" />
          <Row label="Travelers" value="1 traveler" />
          <div style={{ marginTop: 10 }}>
            <DisabledButton variant="primary" icon={Search}>
              Search flights
            </DisabledButton>
          </div>
        </Card>
        <p className="zr-label">Popular routes</p>
        <ResultCard icon={Plane} title="Phnom Penh → Siem Reap" provider="Zivo Air" detail="Direct · 55 min" price="$48" badge="Popular" />
        <ResultCard icon={Hotel} title="Siem Reap city stay" provider="Zivo Stays" detail="3 nights" price="$98" tags={HOTEL_TAGS} />
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/search",
    title: "Search",
    group: "Discover",
    summary: "Search form with trip type, route, dates and travelers.",
    render: () => (
      <PhoneFrame statusLabel="Search" tab="search">
        <ScreenTitle sub="Book in a few steps.">Search flights</ScreenTitle>
        <Card>
          <div className="zr-steps" style={{ marginBottom: 10 }}>
            {["Round trip", "One way", "Multi-city"].map((t, i) => (
              <span key={t} className={`zr-step`} style={i === 0 ? { borderColor: "#9cc2f2", color: "#075af2", fontWeight: 700 } : undefined}>
                {t}
              </span>
            ))}
          </div>
          <Row label="From" value="Phnom Penh (PNH)" strong />
          <Row label="To" value="Siem Reap (REP)" strong />
          <Row label={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Calendar size={14} aria-hidden />Depart</span>} value="Jun 15, 2026" />
          <Row label={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Calendar size={14} aria-hidden />Return</span>} value="Jun 18, 2026" />
          <Row label={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Users size={14} aria-hidden />Travelers</span>} value="1 adult" />
          <div style={{ marginTop: 10 }}>
            <DisabledButton variant="primary" icon={Search}>
              Search flights
            </DisabledButton>
          </div>
        </Card>
        <Note tone="info">Search runs on local demo data in review — no external provider or inventory is queried.</Note>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/results",
    title: "Results",
    group: "Discover",
    summary: "Ranked flight options from local fixtures.",
    render: () => (
      <PhoneFrame statusLabel="Results" tab="search">
        <ScreenTitle sub="3 options ready for Jun 15, 2026">Flights · Phnom Penh → Siem Reap</ScreenTitle>
        <ResultCard icon={Plane} title="Morning direct" provider="Zivo Air" detail="08:15 · 55 min" price="$48" badge="Fastest" tags={["Direct", "Carry-on", "Mobile boarding"]} />
        <ResultCard icon={Plane} title="Value midday" provider="Mekong Wings" detail="12:25 · 1 hr" price="$44" badge="Best value" tags={["Low fare", "Instant confirm"]} />
        <ResultCard icon={Plane} title="Flexible evening" provider="Cambodia Sky" detail="17:40 · 1 hr 5 min" price="$56" tags={["Free change", "Seat choice"]} />
        <DisabledButton variant="primary" icon={ArrowRight}>
          Select
        </DisabledButton>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/property",
    title: "Property",
    group: "Discover",
    summary: "Hotel property detail with amenities and room entry.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Property" tab="search">
        <ScreenTitle sub="Siem Reap center · 4.8 guest score">Riverside Suite</ScreenTitle>
        <div
          className="zr-result-thumb"
          style={{ width: "100%", height: 150, borderRadius: 18 }}
          role="img"
          aria-label="Illustrative property image (demo)"
        >
          <Hotel size={40} aria-hidden />
        </div>
        <Card>
          <Row label="Provider" value="Zivo Stays" />
          <Row label="Location" value="Siem Reap center" />
          <Row label="Stay" value="Jun 15 – Jun 18 · 3 nights" />
          <div className="zr-tags" style={{ marginTop: 8 }}>
            {["Breakfast", "Pool", "Free cancel", "Airport pickup"].map((t) => (
              <span key={t} className="zr-tag">{t}</span>
            ))}
          </div>
        </Card>
        <Card className="zr-card--tight">
          <Row label="From" value={<span><span className="zr-strong">$126</span> <span className="zr-sub">/ 3 nights</span></span>} />
        </Card>
        <DisabledButton variant="primary" icon={BedDouble}>
          Choose a room
        </DisabledButton>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/room-selection",
    title: "Room selection",
    group: "Discover",
    summary: "Room options with rates and cancellation policy.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Rooms" tab="search">
        <ScreenTitle sub="Riverside Suite · Jun 15 – Jun 18">Choose a room</ScreenTitle>
        {[
          { name: "Standard queen", price: "$126", note: "Free cancel · Breakfast", tone: "positive" as const, sel: true },
          { name: "Deluxe river view", price: "$168", note: "Free cancel · Balcony", tone: "info" as const, sel: false },
          { name: "Family suite", price: "$214", note: "Sleeps 4 · Breakfast", tone: "neutral" as const, sel: false },
        ].map((r) => (
          <Card key={r.name} className="zr-card--tight">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <p className="zr-strong" style={{ margin: 0, fontSize: 14 }}>{r.name}</p>
                <p className="zr-sub" style={{ margin: 0 }}>{r.note}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="zr-strong" style={{ margin: 0 }}>{r.price}</p>
                {r.sel ? <Pill tone="positive" icon={CheckCircle2}>Selected</Pill> : <span className="zr-tag">Select</span>}
              </div>
            </div>
          </Card>
        ))}
        <DisabledButton variant="primary" icon={ArrowRight}>
          Continue
        </DisabledButton>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  // ---- Book ------------------------------------------------------------
  {
    path: "/travel/booking-summary",
    title: "Booking summary",
    group: "Book",
    summary: "Checkout summary with subtotal, service fee and total.",
    render: () => (
      <PhoneFrame statusLabel="Review trip" tab="search">
        <ScreenTitle sub="Selected on Zivo Travel, completed securely on Zivos Media.">Trip option</ScreenTitle>
        <ResultCard icon={Plane} title="Morning direct" provider="Zivo Air" detail="PNH → REP · 08:15" price="$48" />
        <Card>
          <p className="zr-label">Checkout summary</p>
          <Row label="Subtotal" value="$48.00" />
          <Row label="Service fee" value="$3.84" />
          <div className="zr-divider" />
          <Row label="Total due" value="$51.84" strong />
        </Card>
        <Steps steps={[{ label: "Result selected" }, { label: "Review trip" }, { label: "Sign in" }, { label: "Pay" }, { label: "Wallet record" }]} />
        <PaymentBookingState payment="not-started" booking="draft" />
        <DisabledButton variant="primary" icon={ArrowRight}>
          Continue secure checkout
        </DisabledButton>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/travelers",
    title: "Travelers",
    group: "Book",
    summary: "Traveler details form (no data is submitted in review).",
    render: () => (
      <PhoneFrame statusLabel="Traveler details" tab="search">
        <ScreenTitle sub="Who's travelling?">Traveler details</ScreenTitle>
        <Card>
          {[
            { label: "Full name", value: "Guest Traveler" },
            { label: "Email", value: "guest@example.com" },
            { label: "Phone", value: "+855 •• ••• •••" },
            { label: "Preference", value: "Flexible timing" },
          ].map((f) => (
            <div key={f.label} style={{ padding: "6px 0" }}>
              <span className="zr-label">{f.label}</span>
              <div
                className="zr-row-value"
                aria-disabled="true"
                style={{ marginTop: 4, padding: "10px 12px", border: "1px solid var(--z-line)", borderRadius: 12, background: "#fff", opacity: 0.75 }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </Card>
        <Note tone="info" icon={ShieldCheck}>
          Fields are read-only in review. No traveler data is entered, validated, or submitted anywhere.
        </Note>
        <DisabledButton variant="primary" icon={ArrowRight}>
          Save & continue
        </DisabledButton>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/price-changed",
    title: "Price changed",
    group: "Book",
    summary: "Fare re-quoted before payment; traveler must accept the new total.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Price update" tab="search">
        <ScreenTitle sub="The fare was re-checked before payment.">Price changed</ScreenTitle>
        <Card>
          <Row label="Previous total" value={<s>$51.84</s>} />
          <Row label="New total" value="$54.72" strong valueClass="" />
          <div className="zr-divider" />
          <Row label="Difference" value="+$2.88" />
        </Card>
        <Note tone="pending" icon={AlertTriangle}>
          Prices can change until payment. Nothing is charged and the booking is not confirmed until you accept the new
          total.
        </Note>
        <PaymentBookingState payment="not-started" booking="not-confirmed" />
        <div className="zr-btn-row">
          <DisabledButton variant="outline">Keep old trip</DisabledButton>
          <DisabledButton variant="primary">Accept new price</DisabledButton>
        </div>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  // ---- Payment & booking (kept separate) -------------------------------
  {
    path: "/travel/payment-pending",
    title: "Payment pending",
    group: "Payment & booking",
    summary: "Payment is processing; booking stays unconfirmed until the provider confirms.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Payment" tab="search">
        <ScreenTitle sub="We're waiting for the payment result.">Payment pending</ScreenTitle>
        <Card>
          <Row label="Booking reference" value="ztb_9f21c4a0e8" />
          <Row label="Amount" value="$51.84" />
          <Row label="Method" value="ZIVO Wallet" />
        </Card>
        <PaymentBookingState payment="pending" booking="not-confirmed" />
        <WalletConnect state="payment-pending" />
        <DisabledButton variant="outline" icon={RefreshCw}>
          Check status
        </DisabledButton>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/booking-pending",
    title: "Booking pending",
    group: "Payment & booking",
    summary: "Payment succeeded; the provider has not yet confirmed the booking.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Booking" tab="trips">
        <ScreenTitle sub="Payment went through — the provider is confirming.">Booking pending</ScreenTitle>
        <Card>
          <Row label="Booking reference" value="ztb_9f21c4a0e8" />
          <Row label="Trip" value="Morning direct · PNH → REP" />
          <Row label="Provider" value="Zivo Air" />
        </Card>
        <PaymentBookingState payment="succeeded" booking="confirming" />
        <Note tone="pending" icon={Clock}>
          This is the important in-between state: the <strong>payment succeeded</strong> but the{" "}
          <strong>booking is not yet confirmed</strong>. Do not treat a successful payment as a confirmed trip.
        </Note>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/confirmed",
    title: "Confirmed",
    group: "Payment & booking",
    summary: "Provider confirmed the booking (a distinct state from payment success).",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Confirmed" tab="trips">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", padding: "8px 0" }}>
          <span className="zr-empty-icon" style={{ background: "var(--z-success-bg)", color: "var(--z-success)" }}>
            <CheckCircle2 size={34} aria-hidden />
          </span>
          <h2 className="zr-h2">Booking confirmed</h2>
          <p className="zr-sub">The provider confirmed your trip.</p>
        </div>
        <Card>
          <Row label="Booking reference" value="ztb_9f21c4a0e8" strong />
          <Row label="Trip" value="PNH → REP · Jun 15, 08:15" />
          <Row label="Traveler" value="Guest Traveler" />
        </Card>
        <PaymentBookingState payment="succeeded" booking="confirmed" />
        <DisabledButton variant="primary" icon={ReceiptText}>
          View itinerary
        </DisabledButton>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  // ---- After booking ---------------------------------------------------
  {
    path: "/travel/cancellation",
    title: "Cancellation",
    group: "After booking",
    summary: "Cancel a confirmed booking with policy and refund preview.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Cancel trip" tab="trips">
        <ScreenTitle sub="Review before you cancel.">Cancel booking</ScreenTitle>
        <Card>
          <Row label="Trip" value="PNH → REP · Jun 15" />
          <Row label="Policy" value="Free cancel until Jun 13" />
          <div className="zr-divider" />
          <Row label="Estimated refund" value="$51.84" strong valueClass="" />
        </Card>
        <PaymentBookingState payment="succeeded" booking="cancelled" note={false} />
        <Note tone="pending" icon={AlertTriangle}>
          Cancelling the booking starts a separate refund. The refund is not instant — it is tracked on its own (see the
          Refund state).
        </Note>
        <div className="zr-btn-row">
          <DisabledButton variant="outline">Keep booking</DisabledButton>
          <DisabledButton variant="danger" icon={XCircle}>
            Cancel booking
          </DisabledButton>
        </div>
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/refund",
    title: "Refund",
    group: "After booking",
    summary: "Refund in progress — distinct from cancellation and from payment.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Refund" tab="wallet">
        <ScreenTitle sub="Your refund is being processed.">Refund pending</ScreenTitle>
        <Card>
          <Row label="Booking reference" value="ztb_9f21c4a0e8" />
          <Row label="Refund amount" value="$51.84" strong />
          <Row label="To" value="ZIVO Wallet" />
          <Row label="Expected" value="1–5 business days" />
        </Card>
        <PaymentBookingState payment="refund-pending" booking="cancelled" note={false} />
        <WalletConnect state="refund-pending" />
        <DesignedTag />
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/trip-status",
    title: "Trip status",
    group: "After booking",
    summary: "My trips list with draft, confirmed and synced states.",
    render: () => (
      <PhoneFrame statusLabel="My trips" tab="trips">
        <ScreenTitle sub="Drafts and booked trips.">My trips</ScreenTitle>
        <div className="zr-steps" style={{ marginBottom: 4 }}>
          {["All", "Checkout ready", "Preview", "Synced"].map((f, i) => (
            <span key={f} className="zr-step" style={i === 0 ? { borderColor: "#9cc2f2", color: "#075af2", fontWeight: 700 } : undefined}>
              {f}
            </span>
          ))}
        </div>
        {[
          { ref: "ztb_9f21c4a0e8", trip: "PNH → REP · Flight", pay: "Succeeded", book: "Confirmed", tone: "positive" as const, icon: CheckCircle2 },
          { ref: "ztb_71bd02f5", trip: "Siem Reap stay · Hotel", pay: "Pending", book: "Draft only", tone: "pending" as const, icon: Clock },
          { ref: "ztb_44aa9c31", trip: "PNH → REP · Bus", pay: "Not started", book: "Draft only", tone: "neutral" as const, icon: ReceiptText },
        ].map((t) => (
          <Card key={t.ref} className="zr-card--tight">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <p className="zr-strong" style={{ margin: 0, fontSize: 13 }}>{t.trip}</p>
                <p className="zr-sub" style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{t.ref}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                <span className="zr-tag">Pay: {t.pay}</span>
                <Pill tone={t.tone} icon={t.icon}>Book: {t.book}</Pill>
              </div>
            </div>
          </Card>
        ))}
      </PhoneFrame>
    ),
  },
  // ---- States ----------------------------------------------------------
  {
    path: "/travel/empty",
    title: "Empty",
    group: "States",
    summary: "No saved trip drafts yet.",
    render: () => (
      <PhoneFrame statusLabel="My trips" tab="trips">
        <div className="zr-empty">
          <span className="zr-empty-icon">
            <ReceiptText size={30} aria-hidden />
          </span>
          <div>
            <h2 className="zr-h2">No saved trip drafts yet</h2>
            <p className="zr-sub" style={{ maxWidth: 280 }}>Search a flight, hotel, car, or bus to start a trip draft.</p>
          </div>
          <DisabledButton variant="primary" icon={Search}>
            Start a search
          </DisabledButton>
        </div>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/offline",
    title: "Offline",
    group: "States",
    summary: "No connection — offline fallback.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Offline" tab="search">
        <div className="zr-empty">
          <span className="zr-empty-icon" style={{ background: "#eef3f9", color: "var(--z-muted)" }}>
            <CloudOff size={30} aria-hidden />
          </span>
          <div>
            <h2 className="zr-h2">You're offline</h2>
            <p className="zr-sub" style={{ maxWidth: 280 }}>Check your connection. Your saved trip drafts are still available.</p>
          </div>
          <Pill tone="neutral" icon={CloudOff}>No connection</Pill>
          <DisabledButton variant="outline" icon={RefreshCw}>
            Retry
          </DisabledButton>
        </div>
      </PhoneFrame>
    ),
  },
  {
    path: "/travel/error",
    title: "Error",
    group: "States",
    summary: "Recoverable error; nothing was booked or charged.",
    designed: true,
    render: () => (
      <PhoneFrame statusLabel="Something went wrong" tab="search">
        <div className="zr-empty">
          <span className="zr-empty-icon" style={{ background: "var(--z-danger-bg)", color: "var(--z-danger)" }}>
            <AlertTriangle size={30} aria-hidden />
          </span>
          <div>
            <h2 className="zr-h2">Something went wrong</h2>
            <p className="zr-sub" style={{ maxWidth: 280 }}>We couldn't load this screen. Nothing was booked or charged.</p>
          </div>
          <Pill tone="critical" icon={AlertTriangle}>Error · no booking created</Pill>
          <DisabledButton variant="primary" icon={RefreshCw}>
            Try again
          </DisabledButton>
        </div>
      </PhoneFrame>
    ),
  },
  // ---- Wallet connection ----------------------------------------------
  {
    path: "/travel/wallet-connection",
    title: "ZIVO Wallet connection",
    group: "Wallet connection",
    summary: "Safe, disabled cross-app ZIVO Wallet states (pay / open / payment / refund / transfer).",
    render: () => (
      <PhoneFrame statusLabel="ZIVO Wallet" tab="wallet">
        <ScreenTitle sub="Disabled cross-app states. No deep link auto-pays.">ZIVO Wallet connection</ScreenTitle>
        <WalletConnect state="pay" />
        <WalletConnect state="open" />
        <WalletConnect state="payment-pending" />
        <WalletConnect state="payment-confirmed" />
        <WalletConnect state="payment-failed" />
        <WalletConnect state="refund-pending" />
        <WalletConnect state="transfer-status" />
      </PhoneFrame>
    ),
  },
];

export const TRAVEL_SNAPSHOT_MAP: Record<string, Snapshot> = Object.fromEntries(
  TRAVEL_SNAPSHOTS.map((s) => [s.path, s]),
);
