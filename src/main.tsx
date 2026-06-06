import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  BedDouble,
  Bell,
  Bus,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleUserRound,
  Globe2,
  Headphones,
  Hotel,
  Plane,
  Repeat2,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import bridge from "../zivo-travel-bridge.json";
import "./styles.css";

const engineOrigin =
  import.meta.env.VITE_ZIVO_PLATFORM_ORIGIN || bridge.platformOrigin || "https://zivosmedia.com";

const searchTabs = [
  { label: "Flights", icon: Plane, href: "/flights?from=Phnom%20Penh&to=Siem%20Reap&start=2026-06-15&end=2026-06-18&travelers=1" },
  { label: "Hotels", icon: Hotel, href: "/hotels?city=Siem%20Reap&ci=2026-06-15&co=2026-06-18&adults=1" },
  { label: "Rental cars", icon: Car, href: "/cars?city=Siem%20Reap&pickup_date=2026-06-15&return_date=2026-06-18" },
  { label: "Bus", icon: Bus, href: "/bus?from=Phnom%20Penh&to=Siem%20Reap&date=2026-06-15" }
];

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

function engineUrl(path: string) {
  return new URL(path, engineOrigin).toString();
}

function App() {
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
          {["Flights", "Hotels", "Rental cars", "Bus", "Deals"].map((label, index) => (
            <a key={label} href={engineUrl(searchTabs[index]?.href || "/zivo-travel")}>
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
        <SearchPanel />
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
    </main>
  );
}

function SearchPanel() {
  return (
    <article className="search-panel">
      <h1>Where will you go next?</h1>
      <p>Search flights, hotels, cars and buses — all in one place.</p>

      <div className="search-tabs" role="tablist" aria-label="Travel type">
        {searchTabs.map(({ label, icon: Icon, href }, index) => (
          <a key={label} className={index === 0 ? "active" : ""} href={engineUrl(href)}>
            <Icon size={19} />
            {label}
          </a>
        ))}
      </div>

      <div className="trip-type" aria-label="Flight trip type">
        <span className="selected">Round trip</span>
        <span>One way</span>
        <span>Multi-city</span>
      </div>

      <div className="flight-fields">
        <Field label="From" value="Phnom Penh" helper="PNH" />
        <button className="swap-btn" aria-label="Swap route">
          <Repeat2 size={19} />
        </button>
        <Field label="To" value="Siem Reap" helper="REP" />
        <Field icon={CalendarDays} label="Depart" value="Jun 15, 2026" />
        <Field icon={CalendarDays} label="Return" value="Jun 18, 2026" />
      </div>

      <div className="search-footer">
        <div className="mini-proof">
          <span>
            <ShieldCheck size={15} />
            Secure booking
          </span>
          <span>Best price guarantee</span>
          <span>24/7 support</span>
        </div>
        <a className="primary-search" href={engineUrl(searchTabs[0].href)}>
          Search flights
          <ArrowRight size={20} />
        </a>
      </div>
    </article>
  );
}

function FeatureHero() {
  return (
    <article className="feature-card">
      <img
        className="feature-image"
        src="https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1400&q=85"
        alt="Siem Reap temple destination"
      />
      <div className="feature-copy">
        <span>Discover more.</span>
        <strong>Live more.</strong>
        <p>Your journey starts here.</p>
        <a href={engineUrl("/zivo-travel")}>
          Start booking
          <ArrowRight size={18} />
        </a>
      </div>
      <div className="cloud one" />
      <div className="cloud two" />
      <div className="balloon balloon-one" aria-hidden="true" />
      <div className="balloon balloon-two" aria-hidden="true" />
      <div className="balloon balloon-three" aria-hidden="true" />
      <div className="plane-3d" aria-hidden="true">
        <span />
      </div>
      <div className="feature-benefits">
        {["Trusted by millions", "Flexible changes", "Earn rewards", "No hidden fees"].map((item) => (
          <span key={item}>
            <ShieldCheck size={15} />
            {item}
          </span>
        ))}
      </div>
    </article>
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
