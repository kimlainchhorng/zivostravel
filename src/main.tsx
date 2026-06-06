import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  BedDouble,
  Bell,
  Bus,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleUserRound,
  CreditCard,
  Globe2,
  Headphones,
  Hotel,
  Landmark,
  Link2,
  LockKeyhole,
  Plane,
  ReceiptText,
  Repeat2,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import heroCardImage from "../public/assets/zivo-travel-hero-card.png";
import bridge from "../zivo-travel-bridge.json";
import "./styles.css";

const engineOrigin =
  import.meta.env.VITE_ZIVO_PLATFORM_ORIGIN || bridge.platformOrigin || "https://zivosmedia.com";

type SearchKind = "flights" | "hotels" | "cars" | "bus";
type TripType = "Round trip" | "One way" | "Multi-city";
type BackendStatus = {
  mode: string;
  platformOrigin: string;
  travelSupabaseUrl?: string;
  authoritySupabaseUrl?: string;
  services?: string[];
  routes?: Partial<Record<SearchKind | "checkout" | "wallet" | "support", string>>;
  checkedAt?: string;
};
type QuotePayload = {
  product: SearchKind;
  label: string;
  currency: string;
  total: number;
  provider: string;
  mode: string;
  checkoutUrl: string;
  paymentUrl: string;
  walletUrl: string;
  payoutUrl: string;
  ssoUrl: string;
  steps: Array<{ label: string; status: string }>;
};

const searchTabs = [
  {
    id: "flights",
    label: "Flights",
    icon: Plane,
    cta: "Search flights",
    href: "/flights?from=Phnom%20Penh&to=Siem%20Reap&start=2026-06-15&end=2026-06-18&travelers=1"
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: Hotel,
    cta: "Search hotels",
    href: "/hotels?city=Siem%20Reap&ci=2026-06-15&co=2026-06-18&adults=1"
  },
  {
    id: "cars",
    label: "Rental cars",
    icon: Car,
    cta: "Search cars",
    href: "/cars?city=Siem%20Reap&pickup_date=2026-06-15&return_date=2026-06-18"
  },
  {
    id: "bus",
    label: "Bus",
    icon: Bus,
    cta: "Search buses",
    href: "/bus?from=Phnom%20Penh&to=Siem%20Reap&date=2026-06-15"
  }
] satisfies Array<{
  id: SearchKind;
  label: string;
  icon: typeof Plane;
  cta: string;
  href: string;
}>;

const navLinks = [
  { label: "Flights", href: searchTabs[0].href },
  { label: "Hotels", href: searchTabs[1].href },
  { label: "Rental cars", href: searchTabs[2].href },
  { label: "Bus", href: searchTabs[3].href },
  { label: "Deals", href: "/deals" }
];

const tripTypes: TripType[] = ["Round trip", "One way", "Multi-city"];

const defaultRoute = {
  from: "Phnom Penh",
  fromCode: "PNH",
  to: "Siem Reap",
  toCode: "REP"
};

const defaultDates = {
  depart: "2026-06-15",
  return: "2026-06-18",
  departLabel: "Jun 15, 2026",
  returnLabel: "Jun 18, 2026"
};

const routes = [
  {
    from: "Phnom Penh",
    to: "Siem Reap",
    price: "$48",
    image:
      "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80"
  },
  {
    from: "New York",
    to: "United States",
    price: "$499",
    image:
      "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80"
  },
  {
    from: "Tokyo",
    to: "Japan",
    price: "$799",
    image:
      "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=900&q=80"
  }
];

const tripProducts = [
  { label: "Flights", body: "Find the best flights", icon: Plane, color: "blue" },
  { label: "Hotels", body: "Stay your way", icon: BedDouble, color: "navy" },
  { label: "Rental cars", body: "Drive your adventure", icon: Car, color: "red" },
  { label: "Bus", body: "Travel by bus", icon: Bus, color: "teal" }
];

const trustItems = [
  { title: "Easy booking", body: "Book in minutes", icon: CalendarDays },
  { title: "24/7 support", body: "We're here anytime", icon: Headphones },
  { title: "Secure payments", body: "Your data is protected", icon: ShieldCheck },
  { title: "Best price guarantee", body: "We promise the best", icon: WalletCards },
  { title: "Flexible options", body: "Change with ease", icon: Repeat2 }
];

const workflowTabs = searchTabs.map(({ id, label, icon }) => ({ id, label, icon }));

const quoteDefaults: Record<SearchKind, { label: string; total: number }> = {
  flights: { label: "Phnom Penh to Siem Reap flight", total: 48 },
  hotels: { label: "Siem Reap hotel stay", total: 126 },
  cars: { label: "Siem Reap rental car", total: 84 },
  bus: { label: "Phnom Penh to Siem Reap bus", total: 18 }
};

const connectionItems = [
  { label: "SSO", value: "Auth handoff", icon: LockKeyhole },
  { label: "Payment", value: "Checkout ready", icon: CreditCard },
  { label: "Payout", value: "Wallet ledger", icon: Landmark },
  { label: "SEO", value: "Sitemap live", icon: Link2 }
];

function engineUrl(path: string) {
  return new URL(path, engineOrigin).toString();
}

function canUseTravelApi() {
  if (typeof window === "undefined") {
    return false;
  }

  return !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function buildSearchPath(kind: SearchKind, route = defaultRoute, tripType: TripType = "Round trip") {
  if (kind === "hotels") {
    const params = new URLSearchParams({
      city: route.to,
      ci: defaultDates.depart,
      co: defaultDates.return,
      adults: "1"
    });

    return `/hotels?${params.toString()}`;
  }

  if (kind === "cars") {
    const params = new URLSearchParams({
      city: route.to,
      pickup_date: defaultDates.depart,
      return_date: defaultDates.return
    });

    return `/cars?${params.toString()}`;
  }

  if (kind === "bus") {
    const params = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: defaultDates.depart
    });

    return `/bus?${params.toString()}`;
  }

  const params = new URLSearchParams({
    from: route.from,
    to: route.to,
    start: defaultDates.depart,
    travelers: "1",
    tripType: tripType.toLowerCase().replace(/\s+/g, "-")
  });

  if (tripType !== "One way") {
    params.set("end", defaultDates.return);
  }

  return `/flights?${params.toString()}`;
}

function fallbackQuote(kind: SearchKind): QuotePayload {
  const quote = quoteDefaults[kind];
  const params = new URLSearchParams({
    product: kind,
    from: defaultRoute.from,
    to: defaultRoute.to,
    start: defaultDates.depart,
    end: defaultDates.return,
    travelers: "1"
  });

  return {
    product: kind,
    label: quote.label,
    currency: "USD",
    total: quote.total,
    provider: "zivosmedia",
    mode: "local_bridge",
    checkoutUrl: engineUrl(`/travel/checkout?${params.toString()}`),
    paymentUrl: engineUrl(bridge.routing.paymentMethods),
    walletUrl: engineUrl(bridge.routing.wallet),
    payoutUrl: engineUrl(`${bridge.routing.wallet}?tab=payouts`),
    ssoUrl: engineUrl(`${bridge.routing.authHandoff}?app=zivo-travel&redirect=${encodeURIComponent(`/travel/checkout?${params.toString()}`)}`),
    steps: [
      { label: "Search", status: "ready" },
      { label: "Review", status: "ready" },
      { label: "Sign in", status: "handoff" },
      { label: "Pay", status: "handoff" },
      { label: "Confirm", status: "handoff" }
    ]
  };
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canUseTravelApi()) {
      setBackendStatus({
        mode: "local_bridge",
        platformOrigin: engineOrigin,
        travelSupabaseUrl: bridge.travelProject.url,
        services: searchTabs.map((tab) => tab.id),
        routes: bridge.routing
      });
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/travel/status", { headers: { accept: "application/json" } })
      .then((response) => {
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok || !contentType.includes("application/json")) {
          throw new Error("Travel backend status unavailable in local asset mode");
        }

        return response.json() as Promise<BackendStatus>;
      })
      .then((status) => {
        if (!cancelled) {
          setBackendStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendStatus({
            mode: "local_bridge",
            platformOrigin: engineOrigin,
            travelSupabaseUrl: bridge.travelProject.url,
            services: searchTabs.map((tab) => tab.id),
            routes: bridge.routing
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="travel-page">
      <header className="topbar" aria-label="Zivo Travel navigation">
        <a className="brand" href="/" aria-label="Zivo Travel home">
          <span className="brand-mark">Z</span>
          <span className="brand-text">
            <strong>Zivo</strong>
            <small>Travel</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {navLinks.map(({ label, href }) => (
            <a key={label} href={engineUrl(href)}>
              {label}
            </a>
          ))}
        </nav>

        <div className="utility-nav">
          <a className="pill" href={engineUrl("/zivo-travel")}>
            <Globe2 size={16} />
            USD
            <ChevronDown size={14} />
          </a>
          <a className="pill" href={engineUrl("/profile")}>
            <UserRound size={16} />
            My trips
          </a>
          <a className="pill" href={engineUrl(bridge.routing.wallet)}>
            <WalletCards size={16} />
            Wallet
          </a>
          <a className="pill" href={engineUrl(bridge.routing.support)}>
            <Circle size={15} />
            Support
          </a>
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <a className="avatar" href={engineUrl("/profile")} aria-label="Profile">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              alt="Traveler profile"
            />
          </a>
        </div>
      </header>

      <section className="hero-layout" aria-label="Travel search and feature">
        <SearchPanel backendStatus={backendStatus} />
        <FeatureHero />
      </section>

      <section className="content-grid" aria-label="Travel planning">
        <PopularRoutes />
        <BuildTrip />
        <MyTrips />
      </section>

      <section className="trust-strip" aria-label="Booking benefits">
        {trustItems.map(({ title, body, icon: Icon }) => (
          <article key={title} className="trust-item">
            <span>
              <Icon size={22} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </section>

      <BookingWorkflow backendStatus={backendStatus} />
    </main>
  );
}

function SearchPanel({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const [activeKind, setActiveKind] = useState<SearchKind>("flights");
  const [tripType, setTripType] = useState<TripType>("Round trip");
  const [route, setRoute] = useState(defaultRoute);
  const activeTab = searchTabs.find((tab) => tab.id === activeKind) || searchTabs[0];
  const fallbackHandoff = useMemo(
    () => engineUrl(buildSearchPath(activeKind, route, tripType)),
    [activeKind, route, tripType]
  );
  const handoffKey = `${activeKind}|${route.from}|${route.to}|${tripType}`;
  const [handoff, setHandoff] = useState({ key: handoffKey, url: fallbackHandoff });
  const resolvedHandoff = handoff.key === handoffKey ? handoff.url : fallbackHandoff;
  const backendLabel = backendStatus?.mode === "cloudflare_bridge" ? "Backend ready" : "Bridge ready";

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      type: activeKind,
      from: route.from,
      to: route.to,
      start: defaultDates.depart,
      end: defaultDates.return,
      travelers: "1",
      tripType
    });

    setHandoff({ key: handoffKey, url: fallbackHandoff });

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    fetch(`/api/travel/search?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok || !contentType.includes("application/json")) {
          throw new Error("Travel search bridge unavailable in local asset mode");
        }

        return response.json() as Promise<{ handoffUrl?: string }>;
      })
      .then((payload) => {
        if (payload.handoffUrl) {
          setHandoff({ key: handoffKey, url: payload.handoffUrl });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setHandoff({ key: handoffKey, url: fallbackHandoff });
        }
      });

    return () => controller.abort();
  }, [activeKind, fallbackHandoff, handoffKey, route, tripType]);

  function swapRoute() {
    setRoute((current) => ({
      from: current.to,
      fromCode: current.toCode,
      to: current.from,
      toCode: current.fromCode
    }));
  }

  return (
    <article className="search-panel">
      <h1>Where will you go next?</h1>
      <p>Search flights, hotels, cars and buses — all in one place.</p>

      <div className="search-tabs" role="tablist" aria-label="Travel type">
        {searchTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={id === activeKind ? "active" : ""}
            role="tab"
            aria-selected={id === activeKind}
            onClick={() => setActiveKind(id)}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </div>

      <div className="trip-type" aria-label="Flight trip type">
        {tripTypes.map((option) => (
          <button
            key={option}
            type="button"
            className={option === tripType ? "selected" : ""}
            aria-pressed={option === tripType}
            onClick={() => setTripType(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flight-fields">
        <Field
          label={activeKind === "hotels" ? "Destination" : activeKind === "cars" ? "Pick-up" : "From"}
          value={activeKind === "hotels" || activeKind === "cars" ? route.to : route.from}
          helper={activeKind === "hotels" ? "City" : activeKind === "cars" ? "Downtown" : route.fromCode}
        />
        <button className="swap-btn" type="button" aria-label="Swap route" onClick={swapRoute}>
          <Repeat2 size={19} />
        </button>
        <Field
          label={activeKind === "hotels" ? "Stay" : activeKind === "cars" ? "Drop-off" : "To"}
          value={activeKind === "hotels" ? "3 nights" : activeKind === "cars" ? route.to : route.to}
          helper={activeKind === "hotels" ? "1 room" : activeKind === "cars" ? "Same city" : route.toCode}
        />
        <Field
          icon={CalendarDays}
          label={activeKind === "cars" ? "Pick up" : activeKind === "bus" ? "Travel date" : activeKind === "hotels" ? "Check in" : "Depart"}
          value={defaultDates.departLabel}
        />
        <Field
          icon={CalendarDays}
          label={activeKind === "bus" ? "Seat" : activeKind === "hotels" ? "Check out" : "Return"}
          value={activeKind === "bus" ? "1 passenger" : tripType === "One way" && activeKind === "flights" ? "Add later" : defaultDates.returnLabel}
        />
      </div>

      <div className="search-footer">
        <div className="mini-proof">
          <span>
            <ShieldCheck size={15} />
            Secure booking
          </span>
          <span>Best price guarantee</span>
          <span className="backend-proof">{backendLabel}</span>
        </div>
        <a className="primary-search" href={resolvedHandoff}>
          {activeTab.cta}
          <ArrowRight size={20} />
        </a>
      </div>
    </article>
  );
}

function FeatureHero() {
  return (
    <a className="feature-card" href={engineUrl("/zivo-travel")} aria-label="Start booking with Zivo Travel">
      <img
        className="feature-image"
        src={heroCardImage}
        alt="Zivo Travel booking hero with temple, airplane, and balloons"
      />
    </a>
  );
}

function PopularRoutes() {
  return (
    <article className="popular-card">
      <SectionHeader title="Popular routes" />
      <div className="route-grid">
        {routes.map((route) => (
          <a
            key={`${route.from}-${route.to}`}
            className="route-card"
            href={engineUrl(`/flights?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&start=2026-06-15&end=2026-06-18&travelers=1`)}
          >
            <img src={route.image} alt={`${route.from} to ${route.to}`} />
            <button aria-label={`Open ${route.from} route`}>
              <ArrowRight size={18} />
            </button>
            <div>
              <strong>{route.from}</strong>
              <span>{route.to}</span>
              <small>
                from <b>{route.price}</b>
              </small>
            </div>
          </a>
        ))}
      </div>
    </article>
  );
}

function BuildTrip() {
  return (
    <article className="build-card">
      <h2>Build your trip</h2>
      <p>Mix and match to create your perfect journey.</p>
      <div className="build-grid">
        {tripProducts.map(({ label, body, icon: Icon, color }) => (
          <a key={label} className="mini-service" href={engineUrl(searchTabs.find((tab) => tab.label === label)?.href || "/zivo-travel")}>
            <Icon className={color} size={25} />
            <div>
              <strong>{label}</strong>
              <span>{body}</span>
            </div>
          </a>
        ))}
      </div>
      <a className="bundle-card" href={engineUrl("/deals")}>
        <div>
          <strong>Save more with bundle deals</strong>
          <span>Flight + Hotel = Extra savings</span>
        </div>
        <div className="luggage" aria-hidden="true" />
      </a>
    </article>
  );
}

function MyTrips() {
  return (
    <article className="mytrip-card">
      <SectionHeader title="My trips" />
      <div className="trip-preview">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
          alt="Beach trip"
        />
        <span>Upcoming</span>
      </div>
      <div className="trip-details">
        <strong>Phnom Penh → Siem Reap</strong>
        <small>Jun 15 – Jun 18, 2026 • 1 Traveler</small>
        <div>
          <span>
            <Plane size={15} />
            Flight
          </span>
          <a href={engineUrl("/profile")}>View details</a>
        </div>
        <span>
          <Hotel size={15} />
          Hotel
        </span>
      </div>
      <div className="pager" aria-hidden="true">
        <span className="active" />
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

function BookingWorkflow({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const [activeKind, setActiveKind] = useState<SearchKind>("flights");
  const [quote, setQuote] = useState<QuotePayload>(() => fallbackQuote("flights"));
  const activeQuote = quote.product === activeKind ? quote : fallbackQuote(activeKind);
  const connectionMode = backendStatus?.mode === "cloudflare_bridge" ? "Cloudflare bridge" : "Local bridge";

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackQuote(activeKind);
    setQuote(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    const params = new URLSearchParams({
      type: activeKind,
      from: defaultRoute.from,
      to: defaultRoute.to,
      start: defaultDates.depart,
      end: defaultDates.return,
      travelers: "1"
    });

    fetch(`/api/travel/quote?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel quote bridge unavailable");
        }

        return response.json() as Promise<QuotePayload>;
      })
      .then((payload) => setQuote(payload))
      .catch(() => {
        if (!controller.signal.aborted) {
          setQuote(fallback);
        }
      });

    return () => controller.abort();
  }, [activeKind]);

  return (
    <section className="workflow-band" aria-label="Booking workflow">
      <article className="workflow-panel workflow-summary">
        <div>
          <span className="workflow-icon">
            <ReceiptText size={22} />
          </span>
          <h2>Booking workflow</h2>
          <p>{activeQuote.label}</p>
        </div>
        <div className="workflow-tabs" role="tablist" aria-label="Workflow product">
          {workflowTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={id === activeKind ? "active" : ""}
              role="tab"
              aria-selected={id === activeKind}
              onClick={() => setActiveKind(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
        <div className="quote-row">
          <span>Estimate</span>
          <strong>
            {activeQuote.currency} ${activeQuote.total}
          </strong>
        </div>
        <a className="checkout-link" href={activeQuote.checkoutUrl}>
          Continue checkout
          <ArrowRight size={18} />
        </a>
      </article>

      <article className="workflow-panel">
        <div className="workflow-headline">
          <Search size={21} />
          <div>
            <h2>Trip flow</h2>
            <p>{connectionMode}</p>
          </div>
        </div>
        <div className="step-chain">
          {activeQuote.steps.map((step, index) => (
            <div key={step.label} className={index < 2 ? "complete" : ""}>
              <span>
                <CheckCircle2 size={16} />
              </span>
              <strong>{step.label}</strong>
              <small>{step.status}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="workflow-panel connection-panel">
        <div className="workflow-headline">
          <Link2 size={21} />
          <div>
            <h2>Connections</h2>
            <p>{activeQuote.provider}</p>
          </div>
        </div>
        <div className="connection-grid">
          {connectionItems.map(({ label, value, icon: Icon }) => (
            <a
              key={label}
              href={
                label === "SSO"
                  ? activeQuote.ssoUrl
                  : label === "Payment"
                    ? activeQuote.paymentUrl
                    : label === "Payout"
                      ? activeQuote.payoutUrl
                      : "/sitemap.xml"
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              <strong>{value}</strong>
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon?: typeof CalendarDays;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
      {Icon ? <Icon size={16} /> : null}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <div>
        <a href={engineUrl("/zivo-travel")}>View all</a>
        <button aria-label="Previous">
          <ChevronLeft size={16} />
        </button>
        <button aria-label="Next">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
