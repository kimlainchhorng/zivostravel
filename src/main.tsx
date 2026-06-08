import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Bell,
  Bus,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Circle,
  CircleUserRound,
  CreditCard,
  Globe2,
  Headphones,
  Hotel,
  Landmark,
  LayoutGrid,
  Link2,
  LockKeyhole,
  MapPinned,
  Minus,
  Plane,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import heroCardImage from "../public/assets/zivo-travel-hero-card.png";
import routeNewYorkImage from "../public/assets/route-new-york.png";
import routePhnomPenhImage from "../public/assets/route-phnom-penh-siem-reap.png";
import routeTokyoImage from "../public/assets/route-tokyo.png";
import tripBeachImage from "../public/assets/trip-beach-preview.png";
import bridge from "../zivo-travel-bridge.json";
import "./styles.css";

const engineOrigin =
  import.meta.env.VITE_ZIVO_PLATFORM_ORIGIN || bridge.platformOrigin || "https://zivosmedia.com";

// Canonical ZivoChat domain for the one-click support/chat entry. Overridable via
// env; defaults to the live chat host (zivoschat.com, not zivochat.com).
const chatOrigin =
  import.meta.env.VITE_ZIVO_CHAT_ORIGIN || "https://zivoschat.com";

type SearchKind = "flights" | "hotels" | "cars" | "bus";
type CurrencyCode = "USD" | "KHR" | "THB";
type TripType = "Round trip" | "One way" | "Multi-city";
type BackendStatus = {
  mode: string;
  platformOrigin: string;
  travelSupabaseUrl?: string;
  authoritySupabaseUrl?: string;
  dedicatedBackendEnabled?: boolean;
  bookingPersistence?: string;
  searchTelemetry?: string;
  supportPersistence?: string;
  adminQueue?: string;
  walletSummary?: string;
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
type ResultItem = {
  id: string;
  title: string;
  provider: string;
  detail: string;
  time: string;
  duration: string;
  price: number;
  rating: string;
  tags: string[];
  image?: string;
  checkoutUrl: string;
  reviewUrl?: string;
};
type ResultsPayload = {
  product: SearchKind;
  label: string;
  summary: string;
  currency: string;
  provider: string;
  mode: string;
  results: ResultItem[];
};
type SearchField = {
  label: string;
  value: string;
  helper?: string;
  icon?: typeof CalendarDays;
  inputType?: "text" | "date";
  onChange?: (value: string) => void;
};
type SearchContext = {
  from: string;
  to: string;
  start: string;
  end: string;
  count: number;
  rooms: number;
  tripType: string;
  chips: string[];
};
type TripFilter = "all" | "checkout" | "preview" | "synced";
type ReviewSession = {
  product: SearchKind;
  label: string;
  summary: string;
  currency: string;
  provider: string;
  mode: string;
  result: ResultItem;
  subtotal: number;
  serviceFee: number;
  total: number;
  reviewUrl: string;
  checkoutUrl: string;
  paymentUrl: string;
  walletUrl: string;
  payoutUrl: string;
  ssoUrl: string;
  deal?: DealPackage;
  steps: Array<{ label: string; status: string }>;
  ledger: Array<{ label: string; value: string }>;
};
type BookingRecord = {
  id: string | null;
  bookingReference: string;
  status: string;
  serviceType: string;
  resultId: string;
  resultTitle: string;
  provider: string;
  currency: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  reviewUrl: string;
  checkoutUrl: string;
  ssoUrl: string;
  createdAt: string | null;
  dealId?: string;
  traveler?: TravelerDetails;
};
type BookingIntentResponse = {
  mode: string;
  persisted: boolean;
  booking: BookingRecord;
  reason?: string;
};
type SavedTrip = BookingRecord & {
  mode: string;
  persisted: boolean;
  reason?: string;
  savedAt: string;
};
type TravelerDetails = {
  name: string;
  email: string;
  phone: string;
  preference: string;
};
type DealPackage = {
  id: string;
  title: string;
  body: string;
  price: number;
  save: string;
  saveAmount?: number;
  highlight: string;
  image?: string;
  services: SearchKind[];
  reviewKind: SearchKind;
  resultId: string;
  reviewUrl?: string;
};
type DealsPayload = {
  mode: string;
  currency: string;
  provider: string;
  deals: DealPackage[];
};
type AdminQueueRow = {
  id: string;
  customer: string;
  product: string;
  route: string;
  status: string;
  risk: string;
  amount: string;
  lastUpdate: string;
};
type AdminQueuePayload = {
  app: string;
  mode: string;
  persisted: boolean;
  reason?: string;
  supabaseStatus?: number;
  queue: AdminQueueRow[];
  checkedAt: string;
};

const currencyOptions: Array<{ code: CurrencyCode; label: string; rate: number; symbol: string; decimals: number }> = [
  { code: "USD", label: "US Dollar", rate: 1, symbol: "$", decimals: 2 },
  { code: "KHR", label: "Cambodian Riel", rate: 4100, symbol: "៛", decimals: 0 },
  { code: "THB", label: "Thai Baht", rate: 36, symbol: "฿", decimals: 0 }
];

const CurrencyContext = React.createContext<{
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}>({
  currency: "USD",
  setCurrency: () => undefined
});

function useCurrency() {
  return React.useContext(CurrencyContext);
}
type WalletSummaryPayload = {
  app: string;
  mode: string;
  persisted: boolean;
  reason?: string;
  currency: string;
  available: number;
  pending: number;
  rewards: number;
  methods: Array<{ id: string; label: string; detail: string; status: string }>;
  payouts: Array<{ id: string; label: string; amount: number; status: string; eta: string }>;
  links: {
    wallet: string;
    paymentMethods: string;
    payout: string;
    support: string;
  };
  checkedAt: string;
};
type SupportTopicId = "booking" | "payment" | "wallet" | "change";
type SupportForm = {
  name: string;
  email: string;
  bookingReference: string;
  topic: SupportTopicId;
  message: string;
};
type SupportTicket = {
  reference: string;
  status: string;
  topic: SupportTopicId;
  priority: string;
  summary: string;
  customer: string;
  bookingReference?: string;
  chatUrl: string;
  createdAt: string;
};
type SupportTicketResponse = {
  app?: string;
  mode: string;
  persisted: boolean;
  reason?: string;
  ticket: SupportTicket;
  checkedAt?: string;
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

const cityCodeMap: Record<string, string> = {
  "phnom penh": "PNH",
  "siem reap": "REP",
  bangkok: "BKK",
  "new york": "NYC",
  "los angeles": "LAX",
  tokyo: "TYO",
  singapore: "SIN"
};

const savedTripsKey = "zivo-travel-booking-drafts";
const savedTripsEvent = "zivo-travel-bookings-updated";
const currencyKey = "zivo-travel-currency";
const supportTicketsKey = "zivo-travel-support-tickets";
const supportTicketsEvent = "zivo-travel-support-updated";

const zivoApps = [
  { key: "media", name: "Zivosmedia", tagline: "Social, feed & super-app", origin: "https://zivosmedia.com" },
  { key: "travel", name: "Zivo Travel", tagline: "Flights, hotels, cars & bus", origin: "https://zivostravel.com" },
  { key: "driver", name: "Zivo Driver", tagline: "Drive & earn", origin: "https://zivodriver.com" },
  { key: "business", name: "Zivo Business", tagline: "Business profile & billing", origin: "https://zivobusiness.com" },
  { key: "employee", name: "Zivo Employee", tagline: "Schedule, shifts & pay", origin: "https://zivoemployee.com" },
  { key: "software", name: "Zivo Software", tagline: "Business software catalog", origin: "https://zivosoftware.com" },
  { key: "chat", name: "ZivoChat", tagline: "Chat & support", origin: "https://zivoschat.com" },
] as const;

const routes = [
  {
    from: "Phnom Penh",
    to: "Siem Reap",
    price: 48,
    image: routePhnomPenhImage
  },
  {
    from: "New York",
    to: "United States",
    price: 499,
    image: routeNewYorkImage
  },
  {
    from: "Tokyo",
    to: "Japan",
    price: 799,
    image: routeTokyoImage
  }
];

const defaultTripSlides = [
  {
    title: "Phnom Penh → Siem Reap",
    meta: "Jun 15 – Jun 18, 2026 • 1 Traveler",
    service: "Flight",
    secondary: "Hotel",
    status: "Upcoming",
    image: tripBeachImage,
    href: "/trips",
    icon: Plane
  },
  {
    title: "Tokyo spring escape",
    meta: "Flexible dates • Bundle ready",
    service: "Flight",
    secondary: "Hotel",
    status: "Saved idea",
    image: routeTokyoImage,
    href: "/deals",
    icon: Plane
  },
  {
    title: "Siem Reap city stay",
    meta: "Hotel + airport pickup",
    service: "Hotel",
    secondary: "Rental car",
    status: "Bundle",
    image: routePhnomPenhImage,
    href: "/hotels",
    icon: Hotel
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

const tripFilters: Array<{ id: TripFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "checkout", label: "Checkout ready" },
  { id: "preview", label: "Preview" },
  { id: "synced", label: "Synced" }
];

const supportTopics: Array<{
  id: SupportTopicId;
  label: string;
  body: string;
  priority: string;
  icon: typeof Headphones;
}> = [
  {
    id: "booking",
    label: "Booking help",
    body: "Trip drafts, checkout status, confirmation, or itinerary questions.",
    priority: "Fast",
    icon: ReceiptText
  },
  {
    id: "payment",
    label: "Payment issue",
    body: "Card, cash office, refund, payment method, or failed checkout help.",
    priority: "Urgent",
    icon: CreditCard
  },
  {
    id: "wallet",
    label: "Wallet or payout",
    body: "Wallet balance, rewards, cash-out, payout timing, or ledger records.",
    priority: "Normal",
    icon: WalletCards
  },
  {
    id: "change",
    label: "Change trip",
    body: "Flight, hotel, rental car, or bus schedule changes and flexible options.",
    priority: "Normal",
    icon: Repeat2
  }
];

const workflowTabs = searchTabs.map(({ id, label, icon }) => ({ id, label, icon }));

const quoteDefaults: Record<SearchKind, { label: string; total: number }> = {
  flights: { label: "Phnom Penh to Siem Reap flight", total: 48 },
  hotels: { label: "Siem Reap hotel stay", total: 126 },
  cars: { label: "Siem Reap rental car", total: 84 },
  bus: { label: "Phnom Penh to Siem Reap bus", total: 18 }
};

const connectionItems = [
  { key: "account", label: "Account", value: "One sign-in", icon: LockKeyhole },
  { key: "payment", label: "Checkout", value: "Secure payment", icon: CreditCard },
  { key: "wallet", label: "Wallet", value: "Rewards and refunds", icon: WalletCards },
  { key: "seo", label: "Trip pages", value: "Shareable details", icon: Link2 }
];

const dealPackages: DealPackage[] = [
  {
    id: "angkor-flight-hotel",
    title: "Angkor weekend bundle",
    body: "Flight + hotel for a three-night Siem Reap escape with flexible change support.",
    price: 168,
    save: "Save $28",
    saveAmount: 28,
    highlight: "Best starter trip",
    image: routePhnomPenhImage,
    services: ["flights", "hotels"],
    reviewKind: "flights",
    resultId: "flight-angkor-direct"
  },
  {
    id: "city-stay-driver",
    title: "Stay + private driver",
    body: "Hotel, airport pickup, and a private day route for customers who want easy arrival.",
    price: 188,
    save: "Save $34",
    saveAmount: 34,
    highlight: "Most comfortable",
    image: tripBeachImage,
    services: ["hotels", "cars"],
    reviewKind: "hotels",
    resultId: "hotel-temple-garden"
  },
  {
    id: "budget-bus-hotel",
    title: "Budget bus + hotel",
    body: "Reserved bus seat and smart hotel stay for travelers who want the lowest total.",
    price: 116,
    save: "Save $18",
    saveAmount: 18,
    highlight: "Lowest price",
    image: routeTokyoImage,
    services: ["bus", "hotels"],
    reviewKind: "bus",
    resultId: "bus-express"
  }
];

function fallbackDeals(): DealsPayload {
  return {
    mode: "local_deals",
    currency: "USD",
    provider: "zivosmedia",
    deals: dealPackages
  };
}

function mergeDealsWithLocalImages(payload: DealsPayload): DealsPayload {
  const deals = payload.deals.map((deal) => {
    const localDeal = dealPackages.find((item) => item.id === deal.id);

    return {
      ...deal,
      saveAmount: deal.saveAmount ?? localDeal?.saveAmount,
      image: deal.image || localDeal?.image || routePhnomPenhImage,
      reviewUrl: deal.reviewUrl || reviewUrl(deal.reviewKind, deal.resultId, deal.id)
    };
  });

  return { ...payload, deals };
}

const resultCatalog: Record<SearchKind, Omit<ResultItem, "checkoutUrl">[]> = {
  flights: [
    {
      id: "flight-angkor-direct",
      title: "Morning direct",
      provider: "Zivo Air",
      detail: "PNH to REP",
      time: "08:15 AM",
      duration: "55 min",
      price: 48,
      rating: "Fastest",
      tags: ["Direct", "Carry-on included", "Mobile boarding"]
    },
    {
      id: "flight-flex-evening",
      title: "Flexible evening",
      provider: "Cambodia Sky",
      detail: "PNH to REP",
      time: "05:40 PM",
      duration: "1 hr 5 min",
      price: 56,
      rating: "Flexible",
      tags: ["Free change", "Seat choice", "Reward eligible"]
    },
    {
      id: "flight-value-midday",
      title: "Value midday",
      provider: "Mekong Wings",
      detail: "PNH to REP",
      time: "12:25 PM",
      duration: "1 hr",
      price: 44,
      rating: "Best value",
      tags: ["Low fare", "Light bag", "Instant confirm"]
    }
  ],
  hotels: [
    {
      id: "hotel-riverside-suite",
      title: "Riverside suite",
      provider: "Zivo Stays",
      detail: "Siem Reap center",
      time: "Jun 15 - Jun 18",
      duration: "3 nights",
      price: 126,
      rating: "4.8 guest score",
      tags: ["Breakfast", "Pool", "Pay later"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "hotel-temple-garden",
      title: "Temple garden hotel",
      provider: "Angkor Partner",
      detail: "Near night market",
      time: "Jun 15 - Jun 18",
      duration: "3 nights",
      price: 144,
      rating: "Guest favorite",
      tags: ["Airport pickup", "Spa", "Free cancel"],
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "hotel-city-light",
      title: "City light stay",
      provider: "Zivo Stays",
      detail: "Old French Quarter",
      time: "Jun 15 - Jun 18",
      duration: "3 nights",
      price: 98,
      rating: "Smart price",
      tags: ["Workspace", "Breakfast", "Rewards"],
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80"
    }
  ],
  cars: [
    {
      id: "car-compact",
      title: "Compact automatic",
      provider: "Zivo Rentals",
      detail: "Siem Reap downtown",
      time: "Jun 15, 10:00 AM",
      duration: "3 days",
      price: 84,
      rating: "Best value",
      tags: ["Unlimited km", "Insurance ready", "Easy pickup"]
    },
    {
      id: "car-suv",
      title: "Family SUV",
      provider: "Airport Cars",
      detail: "REP airport",
      time: "Jun 15, 11:00 AM",
      duration: "3 days",
      price: 138,
      rating: "Roomy",
      tags: ["5 seats", "Large bags", "Free cancel"]
    },
    {
      id: "car-driver",
      title: "Car with driver",
      provider: "Angkor Driver",
      detail: "Hotel pickup",
      time: "Jun 15, 09:00 AM",
      duration: "Full day",
      price: 62,
      rating: "Local guide",
      tags: ["Private", "Temple route", "Cashless"]
    }
  ],
  bus: [
    {
      id: "bus-express",
      title: "Express coach",
      provider: "Mekong Express",
      detail: "Phnom Penh to Siem Reap",
      time: "07:30 AM",
      duration: "5 hr 45 min",
      price: 18,
      rating: "Best seller",
      tags: ["AC", "Reserved seat", "Mobile ticket"]
    },
    {
      id: "bus-luxury",
      title: "Luxury minibus",
      provider: "Angkor VIP",
      detail: "Hotel area pickup",
      time: "09:00 AM",
      duration: "5 hr 20 min",
      price: 24,
      rating: "Comfort",
      tags: ["Wide seat", "Snack", "Fast route"]
    },
    {
      id: "bus-night",
      title: "Night sleeper",
      provider: "Zivo Bus",
      detail: "Central station",
      time: "11:30 PM",
      duration: "6 hr",
      price: 21,
      rating: "Overnight",
      tags: ["Sleeper", "USB", "Instant confirm"]
    }
  ]
};

function engineUrl(path: string) {
  return new URL(path, engineOrigin).toString();
}

function localUrl(path: string) {
  return path;
}

function readCurrency(): CurrencyCode {
  if (typeof window === "undefined") {
    return "USD";
  }

  const stored = window.localStorage.getItem(currencyKey);

  return stored === "KHR" || stored === "THB" ? stored : "USD";
}

function formatAmountText(amount: string, currency: CurrencyCode) {
  const normalized = amount.replace(/,/g, "");
  const match = normalized.match(/(?:USD|\$)\s*\$?([0-9]+(?:\.[0-9]+)?)/i);

  if (!match) {
    return amount;
  }

  return money(currency, Number(match[1]));
}

function dealSaveLabel(deal: DealPackage, currency: CurrencyCode) {
  const amount = deal.saveAmount ?? Number(deal.save.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(amount) || amount <= 0) {
    return deal.save;
  }

  return `Save ${money(currency, amount)}`;
}

function currentRouteKind(): SearchKind | null {
  if (typeof window === "undefined") {
    return null;
  }

  const route = window.location.pathname.replace(/^\/+/, "").split("/")[0];

  if (route === "flights" || route === "hotels" || route === "cars" || route === "bus") {
    return route;
  }

  return null;
}

function currentReviewKind(): SearchKind | null {
  if (typeof window === "undefined" || window.location.pathname !== "/booking/review") {
    return null;
  }

  const type = window.location.search ? new URLSearchParams(window.location.search).get("type") : null;

  if (type === "hotels" || type === "cars" || type === "bus") {
    return type;
  }

  return "flights";
}

function isTripsRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === "/trips" || window.location.pathname === "/my-trips";
}

function isDealsRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === "/deals";
}

function isOpsRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === "/ops" || window.location.pathname === "/travel/ops";
}

function isWalletRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === "/wallet" || window.location.pathname === "/travel/wallet";
}

function isSupportRoute() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === "/support" || window.location.pathname === "/travel/support";
}

function currentPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
}

function readNumberParam(params: URLSearchParams, keys: string[], fallback: number) {
  const key = keys.find((candidate) => params.has(candidate));
  const value = key ? Number(params.get(key)) : fallback;

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(9, Math.round(value)));
}

function readSearchContext(kind: SearchKind): SearchContext {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const from = params.get("from") || defaultRoute.from;
  const to = params.get("to") || params.get("city") || defaultRoute.to;
  const start = params.get("start") || params.get("date") || params.get("ci") || params.get("pickup_date") || defaultDates.depart;
  const end = params.get("end") || params.get("co") || params.get("return_date") || defaultDates.return;
  const count = readNumberParam(params, ["travelers", "adults", "drivers", "passengers"], 1);
  const rooms = readNumberParam(params, ["rooms"], Math.max(1, Math.ceil(count / 2)));
  const tripType = params.get("tripType")?.replace(/-/g, " ") || "round trip";
  const startLabel = formatTravelDate(start, defaultDates.departLabel);
  const endLabel = formatTravelDate(end, defaultDates.returnLabel);
  const dateChip = kind === "bus" ? startLabel : `${startLabel} - ${endLabel}`;
  const peopleLabel =
    kind === "hotels"
      ? `${count} ${count === 1 ? "guest" : "guests"}`
      : kind === "cars"
        ? `${count} ${count === 1 ? "driver" : "drivers"}`
        : `${count} ${count === 1 ? "traveler" : "travelers"}`;
  const routeChip = kind === "hotels" || kind === "cars" ? to : `${from} to ${to}`;
  const chips = kind === "hotels"
    ? [routeChip, dateChip, peopleLabel, `${rooms} ${rooms === 1 ? "room" : "rooms"}`]
    : kind === "cars"
      ? [routeChip, dateChip, peopleLabel]
      : kind === "bus"
        ? [routeChip, startLabel, `${count} ${count === 1 ? "passenger" : "passengers"}`]
        : [routeChip, dateChip, peopleLabel, formatMode(tripType)];

  return {
    from,
    to,
    start,
    end,
    count,
    rooms,
    tripType,
    chips
  };
}

function isPrimaryNavActive(label: string, href: string) {
  const path = currentPath();

  if (label === "Deals") {
    return path === "/deals";
  }

  const hrefPath = href.split("?")[0];

  if (path === "/booking/review") {
    const type = currentReviewKind();
    return type ? hrefPath.includes(type) : label === "Flights";
  }

  return path === hrefPath;
}

function canUseTravelApi() {
  if (typeof window === "undefined") {
    return false;
  }

  return !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function checkoutUrl(kind: SearchKind, resultId?: string, dealId?: string) {
  const params = new URLSearchParams({
    product: kind,
    from: defaultRoute.from,
    to: defaultRoute.to,
    start: defaultDates.depart,
    end: defaultDates.return,
    travelers: "1"
  });

  if (resultId) {
    params.set("result", resultId);
  }

  if (dealId) {
    params.set("deal", dealId);
  }

  return engineUrl(`/travel/checkout?${params.toString()}`);
}

function reviewUrl(kind: SearchKind, resultId?: string, dealId?: string) {
  const params = new URLSearchParams({
    type: kind,
    from: defaultRoute.from,
    to: defaultRoute.to,
    start: defaultDates.depart,
    end: defaultDates.return,
    travelers: "1"
  });

  if (resultId) {
    params.set("result", resultId);
  }

  if (dealId) {
    params.set("deal", dealId);
  }

  return localUrl(`/booking/review?${params.toString()}`);
}

function resultRequestParams(kind: SearchKind, context: SearchContext) {
  const params = new URLSearchParams({
    type: kind,
    from: context.from,
    to: context.to,
    start: context.start,
    end: context.end,
    travelers: String(context.count)
  });

  if (kind === "flights") {
    params.set("tripType", context.tripType.toLowerCase().replace(/\s+/g, "-"));
  }

  if (kind === "hotels") {
    params.set("city", context.to);
    params.set("ci", context.start);
    params.set("co", context.end);
    params.set("adults", String(context.count));
    params.set("rooms", String(context.rooms));
  }

  if (kind === "cars") {
    params.set("city", context.to);
    params.set("pickup_date", context.start);
    params.set("return_date", context.end);
    params.set("drivers", String(context.count));
  }

  if (kind === "bus") {
    params.set("date", context.start);
    params.set("passengers", String(context.count));
  }

  return params;
}

function resultListUrl(kind: SearchKind, context: SearchContext) {
  const params = resultRequestParams(kind, context);
  params.delete("type");

  return localUrl(`/${kind}?${params.toString()}`);
}

function contextualCheckoutUrl(
  kind: SearchKind,
  resultId: string | undefined,
  dealId: string | undefined,
  context: SearchContext
) {
  const params = resultRequestParams(kind, context);
  params.delete("type");
  params.set("product", kind);

  if (resultId) {
    params.set("result", resultId);
  }

  if (dealId) {
    params.set("deal", dealId);
  }

  return engineUrl(`/travel/checkout?${params.toString()}`);
}

function contextualReviewUrl(
  kind: SearchKind,
  resultId: string | undefined,
  context: SearchContext,
  dealId?: string
) {
  const params = resultRequestParams(kind, context);

  if (resultId) {
    params.set("result", resultId);
  }

  if (dealId) {
    params.set("deal", dealId);
  }

  return localUrl(`/booking/review?${params.toString()}`);
}

function contextualizeReviewSession(session: ReviewSession, kind: SearchKind, context: SearchContext): ReviewSession {
  const reviewHref = contextualReviewUrl(kind, session.result.id, context, session.deal?.id);
  const checkoutHref = contextualCheckoutUrl(kind, session.result.id, session.deal?.id, context);
  const checkoutTarget = new URL(checkoutHref);
  const result = contextualizeResultItem(kind, session.result, context);

  return {
    ...session,
    summary: result.detail,
    reviewUrl: reviewHref,
    checkoutUrl: checkoutHref,
    result: {
      ...result,
      reviewUrl: reviewHref,
      checkoutUrl: checkoutHref
    },
    ssoUrl: engineUrl(
      `${bridge.routing.authHandoff}?app=zivo-travel&redirect=${encodeURIComponent(
        checkoutTarget.pathname + checkoutTarget.search
      )}`
    )
  };
}

function resultLabel(kind: SearchKind) {
  if (kind === "hotels") {
    return "Hotels in Siem Reap";
  }

  if (kind === "cars") {
    return "Rental cars in Siem Reap";
  }

  if (kind === "bus") {
    return "Buses from Phnom Penh to Siem Reap";
  }

  return "Flights from Phnom Penh to Siem Reap";
}

function resultSummary(kind: SearchKind) {
  if (kind === "hotels") {
    return "3 stays ready for Jun 15 - Jun 18, 2026";
  }

  if (kind === "cars") {
    return "3 rental options ready for pickup in Siem Reap";
  }

  if (kind === "bus") {
    return "3 bus departures ready for Jun 15, 2026";
  }

  return "3 flight options ready for Jun 15, 2026";
}

function contextualResultLabel(kind: SearchKind, context: SearchContext) {
  if (kind === "hotels") {
    return `Hotels in ${context.to}`;
  }

  if (kind === "cars") {
    return `Rental cars in ${context.to}`;
  }

  if (kind === "bus") {
    return `Buses from ${context.from} to ${context.to}`;
  }

  return `Flights from ${context.from} to ${context.to}`;
}

function contextualResultSummary(kind: SearchKind, context: SearchContext, count: number) {
  const startLabel = formatTravelDate(context.start, defaultDates.departLabel);
  const endLabel = formatTravelDate(context.end, defaultDates.returnLabel);

  if (kind === "hotels") {
    return `${count} stays ready for ${startLabel} - ${endLabel}`;
  }

  if (kind === "cars") {
    return `${count} rental options ready for pickup in ${context.to}`;
  }

  if (kind === "bus") {
    return `${count} bus departures ready for ${startLabel}`;
  }

  return `${count} flight options ready for ${startLabel}`;
}

function travelDaySpan(start: string, end: string, fallback: number) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);

  return Number.isFinite(diff) && diff > 0 ? diff : fallback;
}

function contextualResultDetail(kind: SearchKind, context: SearchContext) {
  if (kind === "hotels") {
    return `${context.to} stay`;
  }

  if (kind === "cars") {
    return `${context.to} pickup`;
  }

  return `${context.from} to ${context.to}`;
}

function contextualizeResultItem(kind: SearchKind, result: ResultItem, context: SearchContext): ResultItem {
  const startLabel = formatTravelDate(context.start, defaultDates.departLabel);
  const endLabel = formatTravelDate(context.end, defaultDates.returnLabel);

  if (kind === "hotels") {
    const nights = travelDaySpan(context.start, context.end, 3);

    return {
      ...result,
      detail: contextualResultDetail(kind, context),
      time: `${startLabel} - ${endLabel}`,
      duration: `${nights} ${nights === 1 ? "night" : "nights"}`
    };
  }

  if (kind === "cars") {
    const days = travelDaySpan(context.start, context.end, 3);

    return {
      ...result,
      detail: contextualResultDetail(kind, context),
      time: `${startLabel}, 10:00 AM`,
      duration: `${days} ${days === 1 ? "day" : "days"}`
    };
  }

  return {
    ...result,
    detail: contextualResultDetail(kind, context)
  };
}

function fallbackResults(kind: SearchKind): ResultsPayload {
  return {
    product: kind,
    label: resultLabel(kind),
    summary: resultSummary(kind),
    currency: "USD",
    provider: "zivosmedia",
    mode: "local_results",
    results: resultCatalog[kind].map((result) => ({
      ...result,
      checkoutUrl: checkoutUrl(kind, result.id),
      reviewUrl: reviewUrl(kind, result.id)
    }))
  };
}

function selectedDeal(dealId?: string | null) {
  return dealPackages.find((deal) => deal.id === dealId) || null;
}

function dealServiceLabel(kind: SearchKind) {
  return serviceLabel(serviceType(kind));
}

function selectedResult(kind: SearchKind, resultId?: string | null): ResultItem {
  const result = resultCatalog[kind].find((item) => item.id === resultId) || resultCatalog[kind][0];

  return {
    ...result,
    checkoutUrl: checkoutUrl(kind, result.id),
    reviewUrl: reviewUrl(kind, result.id)
  };
}

function fallbackReviewSession(kind: SearchKind, resultId?: string | null, dealId?: string | null): ReviewSession {
  const deal = selectedDeal(dealId);
  const sessionKind = deal?.reviewKind || kind;
  const baseResult = selectedResult(sessionKind, deal?.resultId || resultId);
  const result = deal
    ? {
        ...baseResult,
        title: deal.title,
        provider: "Zivo Deals",
        detail: deal.body,
        price: deal.price,
        rating: deal.highlight,
        tags: [deal.save, ...deal.services.map(dealServiceLabel), "Bundle"],
        checkoutUrl: checkoutUrl(sessionKind, baseResult.id, deal.id),
        reviewUrl: reviewUrl(sessionKind, baseResult.id, deal.id)
      }
    : baseResult;
  const serviceFee = Math.max(3, Math.round(result.price * 0.08));
  const total = result.price + serviceFee;

  return {
    product: sessionKind,
    label: `Review ${result.title}`,
    summary: result.detail,
    currency: "USD",
    provider: "zivosmedia",
    mode: "local_review",
    result,
    subtotal: result.price,
    serviceFee,
    total,
    reviewUrl: result.reviewUrl || reviewUrl(kind, result.id),
    checkoutUrl: result.checkoutUrl,
    paymentUrl: engineUrl(bridge.routing.paymentMethods),
    walletUrl: engineUrl(bridge.routing.wallet),
    payoutUrl: engineUrl(`${bridge.routing.wallet}?tab=payouts`),
    ssoUrl: engineUrl(
      `${bridge.routing.authHandoff}?app=zivo-travel&redirect=${encodeURIComponent(
        new URL(result.checkoutUrl).pathname + new URL(result.checkoutUrl).search
      )}`
    ),
    deal: deal || undefined,
    steps: [
      { label: "Result selected", status: "ready" },
      { label: "Review trip", status: "ready" },
      { label: "Sign in", status: "handoff" },
      { label: "Pay", status: "handoff" },
      { label: "Wallet record", status: "handoff" }
    ],
    ledger: [
      { label: "Booking source", value: "Zivo Travel" },
      ...(deal ? [{ label: "Package", value: `${deal.save} bundle` }] : []),
      { label: "Checkout authority", value: "Zivos Media" },
      { label: "Payment rail", value: "Saved methods" },
      { label: "Payout record", value: "Wallet ledger" }
    ]
  };
}

function localBookingReference() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now()}`.slice(-12);

  return `ztb_${random.toLowerCase()}`;
}

function withBookingReference(rawUrl: string, bookingReference: string) {
  const base =
    typeof window === "undefined" ? "https://zivostravel.com" : window.location.origin;
  const url = new URL(rawUrl, base);
  url.searchParams.set("booking_reference", bookingReference);

  return rawUrl.startsWith("/") ? `${url.pathname}${url.search}` : url.toString();
}

function serviceType(kind: SearchKind) {
  if (kind === "flights") return "flight";
  if (kind === "hotels") return "hotel";
  if (kind === "cars") return "rental_car";
  return "bus";
}

const defaultTravelerDetails: TravelerDetails = {
  name: "Guest Traveler",
  email: "",
  phone: "",
  preference: "Flexible timing"
};

function sanitizeTravelerDetails(value: Partial<TravelerDetails> | null | undefined): TravelerDetails {
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  const email = typeof value?.email === "string" ? value.email.trim() : "";
  const phone = typeof value?.phone === "string" ? value.phone.trim() : "";
  const preference = typeof value?.preference === "string" ? value.preference.trim() : "";

  return {
    name: name || defaultTravelerDetails.name,
    email,
    phone,
    preference: preference || defaultTravelerDetails.preference
  };
}

function travelerSummary(traveler?: TravelerDetails) {
  if (!traveler) {
    return "Traveler details pending";
  }

  const contacts = [traveler.email, traveler.phone].filter(Boolean);

  return contacts.length ? `${traveler.name} • ${contacts.join(" • ")}` : traveler.name;
}

function localBookingIntent(
  session: ReviewSession,
  kind: SearchKind,
  traveler: TravelerDetails = defaultTravelerDetails
): BookingIntentResponse {
  const bookingReference = localBookingReference();
  const travelerDetails = sanitizeTravelerDetails(traveler);

  return {
    mode: "local_booking_preview",
    persisted: false,
    booking: {
      id: null,
      bookingReference,
      status: "preview",
      serviceType: serviceType(kind),
      resultId: session.result.id,
      resultTitle: session.result.title,
      provider: session.result.provider,
      currency: session.currency,
      subtotal: session.subtotal,
      serviceFee: session.serviceFee,
      total: session.total,
      reviewUrl: withBookingReference(session.reviewUrl, bookingReference),
      checkoutUrl: withBookingReference(session.checkoutUrl, bookingReference),
      ssoUrl: withBookingReference(session.ssoUrl, bookingReference),
      createdAt: null,
      dealId: session.deal?.id,
      traveler: travelerDetails
    },
    reason: "local_preview"
  };
}

function normalizeSavedTrip(value: unknown): SavedTrip | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const trip = value as Partial<SavedTrip>;

  if (
    typeof trip.bookingReference !== "string" ||
    typeof trip.resultTitle !== "string" ||
    typeof trip.checkoutUrl !== "string"
  ) {
    return null;
  }

  return {
    id: trip.id || null,
    bookingReference: trip.bookingReference,
    status: trip.status || "preview",
    serviceType: trip.serviceType || "bus",
    resultId: trip.resultId || "",
    resultTitle: trip.resultTitle,
    provider: trip.provider || "Zivo Travel",
    currency: trip.currency || "USD",
    subtotal: Number(trip.subtotal || 0),
    serviceFee: Number(trip.serviceFee || 0),
    total: Number(trip.total || 0),
    reviewUrl: trip.reviewUrl || "/trips",
    checkoutUrl: trip.checkoutUrl,
    ssoUrl: trip.ssoUrl || engineUrl(bridge.routing.authHandoff),
    createdAt: trip.createdAt || null,
    dealId: trip.dealId,
    traveler: sanitizeTravelerDetails(trip.traveler),
    mode: trip.mode || "local_booking_preview",
    persisted: Boolean(trip.persisted),
    reason: trip.reason,
    savedAt: trip.savedAt || new Date().toISOString()
  };
}

function readSavedTrips() {
  if (typeof window === "undefined") {
    return [] as SavedTrip[];
  }

  try {
    const raw = window.localStorage.getItem(savedTripsKey);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.map(normalizeSavedTrip).filter((trip): trip is SavedTrip => Boolean(trip))
      : [];
  } catch {
    return [];
  }
}

function writeSavedTrips(trips: SavedTrip[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(savedTripsKey, JSON.stringify(trips.slice(0, 12)));
  window.dispatchEvent(new Event(savedTripsEvent));
}

function saveBookingIntent(intent: BookingIntentResponse, traveler?: TravelerDetails) {
  const saved: SavedTrip = {
    ...intent.booking,
    traveler: sanitizeTravelerDetails(traveler || intent.booking.traveler),
    mode: intent.mode,
    persisted: intent.persisted,
    reason: intent.reason,
    savedAt: new Date().toISOString()
  };
  const current = readSavedTrips().filter((trip) => trip.bookingReference !== saved.bookingReference);

  writeSavedTrips([saved, ...current]);

  return saved;
}

function supportTopicLabel(topic: SupportTopicId) {
  return supportTopics.find((item) => item.id === topic)?.label || "Booking help";
}

function supportPriority(topic: SupportTopicId) {
  return supportTopics.find((item) => item.id === topic)?.priority || "Normal";
}

function supportChatUrl(reference?: string) {
  const chat = new URL(bridge.routing.support, engineOrigin);
  chat.searchParams.set("app", "zivo-travel");

  if (reference) {
    chat.searchParams.set("ticket", reference);
  }

  return chat.toString();
}

function localSupportReference() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now()}`.slice(-12);

  return `zts_${random.toLowerCase()}`;
}

function defaultSupportForm(): SupportForm {
  const latestTrip = readSavedTrips()[0];

  return {
    name: latestTrip?.traveler?.name || defaultTravelerDetails.name,
    email: latestTrip?.traveler?.email || "",
    bookingReference: latestTrip?.bookingReference || "",
    topic: "booking",
    message: latestTrip
      ? `Please help with ${latestTrip.resultTitle}.`
      : "Please help me with my Zivo Travel booking."
  };
}

function sanitizeSupportForm(value: Partial<SupportForm>): SupportForm {
  const rawTopic = value.topic;
  const topic = rawTopic === "payment" || rawTopic === "wallet" || rawTopic === "change" ? rawTopic : "booking";

  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim().slice(0, 120) : defaultTravelerDetails.name,
    email: typeof value.email === "string" ? value.email.trim().slice(0, 180) : "",
    bookingReference: typeof value.bookingReference === "string" ? value.bookingReference.trim().slice(0, 80) : "",
    topic,
    message: typeof value.message === "string" && value.message.trim()
      ? value.message.trim().slice(0, 520)
      : "Please help me with my Zivo Travel booking."
  };
}

function localSupportTicket(form: SupportForm): SupportTicketResponse {
  const details = sanitizeSupportForm(form);
  const reference = localSupportReference();

  return {
    app: "zivo-travel",
    mode: "local_support_preview",
    persisted: false,
    reason: "local_preview",
    ticket: {
      reference,
      status: "preview",
      topic: details.topic,
      priority: supportPriority(details.topic),
      summary: details.message,
      customer: details.name,
      bookingReference: details.bookingReference || undefined,
      chatUrl: supportChatUrl(reference),
      createdAt: new Date().toISOString()
    },
    checkedAt: new Date().toISOString()
  };
}

function normalizeSupportTicket(value: unknown): SupportTicket | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const ticket = value as Partial<SupportTicket>;

  if (typeof ticket.reference !== "string" || typeof ticket.summary !== "string") {
    return null;
  }

  return {
    reference: ticket.reference,
    status: ticket.status || "preview",
    topic: ticket.topic || "booking",
    priority: ticket.priority || supportPriority(ticket.topic || "booking"),
    summary: ticket.summary,
    customer: ticket.customer || defaultTravelerDetails.name,
    bookingReference: ticket.bookingReference,
    chatUrl: ticket.chatUrl || supportChatUrl(ticket.reference),
    createdAt: ticket.createdAt || new Date().toISOString()
  };
}

function readSupportTickets() {
  if (typeof window === "undefined") {
    return [] as SupportTicket[];
  }

  try {
    const raw = window.localStorage.getItem(supportTicketsKey);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.map(normalizeSupportTicket).filter((ticket): ticket is SupportTicket => Boolean(ticket))
      : [];
  } catch {
    return [];
  }
}

function writeSupportTickets(tickets: SupportTicket[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(supportTicketsKey, JSON.stringify(tickets.slice(0, 12)));
  window.dispatchEvent(new Event(supportTicketsEvent));
}

function saveSupportTicket(response: SupportTicketResponse) {
  const current = readSupportTickets().filter((ticket) => ticket.reference !== response.ticket.reference);
  writeSupportTickets([response.ticket, ...current]);

  return response.ticket;
}

function fallbackAdminQueue(): AdminQueuePayload {
  const savedRows = readSavedTrips().map((trip) => ({
    id: trip.bookingReference,
    customer: trip.traveler?.name || "Guest checkout",
    product: serviceLabel(trip.serviceType),
    route: trip.resultTitle,
    status: trip.status.replace(/_/g, " "),
    risk: trip.persisted ? "Low" : "Medium",
    amount: `${trip.currency} ${trip.total.toFixed(2)}`,
    lastUpdate: new Date(trip.savedAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }));
  const previewRows = fallbackDeals().deals.map((deal, index) => ({
    id: `preview-${deal.id}`,
    customer: "Guest checkout",
    product: deal.services.map((kind) => serviceLabel(serviceType(kind))).join(" + "),
    route: deal.title,
    status: "Pending checkout",
    risk: index === 0 ? "Medium" : "Low",
    amount: `USD ${deal.price.toFixed(2)}`,
    lastUpdate: "Preview"
  }));

  return {
    app: "zivo-travel",
    mode: "local_admin_queue",
    persisted: false,
    reason: "local_preview",
    queue: savedRows.length ? savedRows : previewRows,
    checkedAt: new Date().toISOString()
  };
}

function fallbackWalletSummary(): WalletSummaryPayload {
  const savedTrips = readSavedTrips();
  const pendingDrafts = savedTrips.reduce((total, trip) => total + Number(trip.total || 0), 0);

  return {
    app: "zivo-travel",
    mode: "local_wallet_preview",
    persisted: false,
    reason: "local_preview",
    currency: "USD",
    available: 356.35,
    pending: pendingDrafts || 116,
    rewards: 42,
    methods: [
      { id: "card-primary", label: "Primary card", detail: "Visa ending 4242", status: "Ready" },
      { id: "wallet-balance", label: "Travel wallet", detail: "Use balance first", status: "Enabled" },
      { id: "cash", label: "Cash office", detail: "Counter collection", status: "Fallback" }
    ],
    payouts: [
      { id: "payout-weekly", label: "Weekly cash out", amount: 188, status: "Scheduled", eta: "Jun 10" },
      { id: "payout-booking", label: "Booking settlement", amount: pendingDrafts || 116, status: "Pending", eta: "After checkout" },
      { id: "payout-reward", label: "Reward credit", amount: 42, status: "Available", eta: "Now" }
    ],
    links: {
      wallet: engineUrl(bridge.routing.wallet),
      paymentMethods: engineUrl(bridge.routing.paymentMethods),
      payout: engineUrl(`${bridge.routing.wallet}?tab=payouts`),
      support: engineUrl(bridge.routing.support)
    },
    checkedAt: new Date().toISOString()
  };
}

function serviceLabel(service: string) {
  if (service === "flight") return "Flight";
  if (service === "hotel") return "Hotel";
  if (service === "rental_car") return "Rental car";
  return "Bus";
}

function serviceIcon(service: string) {
  if (service === "flight") return Plane;
  if (service === "hotel") return Hotel;
  if (service === "rental_car") return Car;
  return Bus;
}

function formatMode(mode: string) {
  return mode
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function money(currency: string, amount: number) {
  const option = currencyOptions.find((item) => item.code === currency) || currencyOptions[0];
  const converted = amount * option.rate;
  const formatted = converted.toLocaleString("en-US", {
    minimumFractionDigits: option.decimals,
    maximumFractionDigits: option.decimals
  });

  if (option.code === "USD") {
    return `${option.code} ${option.symbol}${formatted}`;
  }

  return `${option.code} ${formatted}${option.symbol}`;
}

function cityCode(value: string, fallback: string) {
  const normalized = value.trim().toLowerCase();

  return cityCodeMap[normalized] || fallback;
}

function formatTravelDate(value: string, fallback: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizedTravelDates(dates = defaultDates) {
  return {
    depart: dates.depart || defaultDates.depart,
    return: dates.return || defaultDates.return,
    departLabel: formatTravelDate(dates.depart || defaultDates.depart, defaultDates.departLabel),
    returnLabel: formatTravelDate(dates.return || defaultDates.return, defaultDates.returnLabel)
  };
}

function buildSearchPath(
  kind: SearchKind,
  route = defaultRoute,
  tripType: TripType = "Round trip",
  count = 1,
  dates = defaultDates
) {
  const safeCount = Math.max(1, Math.min(9, count));
  const travelDates = normalizedTravelDates(dates);

  if (kind === "hotels") {
    const params = new URLSearchParams({
      city: route.to,
      ci: travelDates.depart,
      co: travelDates.return,
      adults: String(safeCount),
      rooms: String(Math.max(1, Math.ceil(safeCount / 2)))
    });

    return `/hotels?${params.toString()}`;
  }

  if (kind === "cars") {
    const params = new URLSearchParams({
      city: route.to,
      pickup_date: travelDates.depart,
      return_date: travelDates.return,
      drivers: String(safeCount)
    });

    return `/cars?${params.toString()}`;
  }

  if (kind === "bus") {
    const params = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: travelDates.depart,
      passengers: String(safeCount)
    });

    return `/bus?${params.toString()}`;
  }

  const params = new URLSearchParams({
    from: route.from,
    to: route.to,
    start: travelDates.depart,
    travelers: String(safeCount),
    tripType: tripType.toLowerCase().replace(/\s+/g, "-")
  });

  if (tripType !== "One way") {
    params.set("end", travelDates.return);
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

function workflowStatusCopy(status: string) {
  if (status === "ready") {
    return "Ready now";
  }

  if (status === "handoff") {
    return "Opens securely";
  }

  return formatMode(status);
}

function workflowStepLabel(label: string) {
  if (label === "Sign in") {
    return "Secure sign-in";
  }

  if (label === "Pay") {
    return "Pay safely";
  }

  if (label === "Confirm") {
    return "Trip confirmed";
  }

  if (label === "Wallet record") {
    return "Saved to wallet";
  }

  return label;
}

function handoffSourceLabel(source: string | null) {
  if (source === "zivo-admin") {
    return "Zivo Admin";
  }

  return "Zivos Media";
}

function isLiveBridgeMode(value?: string) {
  return value === "supabase" || value === "supabase_insert";
}

function handoffStatusItems(backendStatus: BackendStatus | null) {
  return [
    {
      label: "Search",
      value: isLiveBridgeMode(backendStatus?.searchTelemetry) ? "Live sync" : "Preview"
    },
    {
      label: "Booking",
      value: isLiveBridgeMode(backendStatus?.bookingPersistence) ? "Draft sync" : "Preview"
    },
    {
      label: "Support",
      value: isLiveBridgeMode(backendStatus?.supportPersistence) ? "Ticket sync" : "Preview"
    }
  ];
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [savedTripCount, setSavedTripCount] = useState(() => readSavedTrips().length);
  const [supportTicketCount, setSupportTicketCount] = useState(() => readSupportTickets().length);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(() => readCurrency());
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const routeKind = currentRouteKind();
  const reviewKind = currentReviewKind();
  const tripsRoute = isTripsRoute();
  const dealsRoute = isDealsRoute();
  const opsRoute = isOpsRoute();
  const walletRoute = isWalletRoute();
  const supportRoute = isSupportRoute();
  const path = currentPath();
  const handoffSource = new URLSearchParams(window.location.search).get("source");
  const isConnectedHandoff = handoffSource === "zivosmedia" || handoffSource === "zivo-admin";
  const handoffLabel = handoffSourceLabel(handoffSource);
  const handoffStatuses = handoffStatusItems(backendStatus);
  const zivoAdminUrl = (import.meta.env.VITE_ZIVO_ADMIN_URL as string) || "https://admin.zivosmedia.com";
  const zivosmediaUrl = (import.meta.env.VITE_ZIVOSMEDIA_URL as string) || "https://zivosmedia.com";

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

  useEffect(() => {
    function refreshTrips() {
      setSavedTripCount(readSavedTrips().length);
    }

    window.addEventListener(savedTripsEvent, refreshTrips);
    window.addEventListener("storage", refreshTrips);

    return () => {
      window.removeEventListener(savedTripsEvent, refreshTrips);
      window.removeEventListener("storage", refreshTrips);
    };
  }, []);

  useEffect(() => {
    function refreshSupportTickets() {
      setSupportTicketCount(readSupportTickets().length);
    }

    window.addEventListener(supportTicketsEvent, refreshSupportTickets);
    window.addEventListener("storage", refreshSupportTickets);

    return () => {
      window.removeEventListener(supportTicketsEvent, refreshSupportTickets);
      window.removeEventListener("storage", refreshSupportTickets);
    };
  }, []);

  useEffect(() => {
    const activeUtility = document.querySelector(".utility-nav .pill.active");

    activeUtility?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(currencyKey, currency);
    }
  }, [currency]);

  useEffect(() => {
    if (!currencyOpen && !notificationsOpen && !appSwitcherOpen) {
      return undefined;
    }

    function closeFloatingPanels(event: PointerEvent) {
      const target = event.target as Element | null;

      if (target?.closest(".currency-menu, .notification-panel, .icon-btn, .app-menu")) {
        return;
      }

      setCurrencyOpen(false);
      setNotificationsOpen(false);
      setAppSwitcherOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCurrencyOpen(false);
        setNotificationsOpen(false);
        setAppSwitcherOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeFloatingPanels);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeFloatingPanels);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [currencyOpen, notificationsOpen, appSwitcherOpen]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      <main className="travel-page">
        {isConnectedHandoff && (
          <section className="handoff-banner" aria-label={`Connected workflow from ${handoffLabel}`}>
            <div className="handoff-copy">
              <span className="handoff-icon">
                <Link2 size={18} />
              </span>
              <div>
                <span>Connected from {handoffLabel}</span>
                <strong>Travel booking handoff</strong>
              </div>
            </div>
            <div className="handoff-status" aria-label="Travel bridge status">
              {handoffStatuses.map((item) => (
                <span
                  key={item.label}
                  className={item.value.includes("sync") ? "ready" : ""}
                >
                  <b>{item.label}</b>
                  {item.value}
                </span>
              ))}
            </div>
            <div className="handoff-actions">
              <a href={zivosmediaUrl}>Return to Zivos Media</a>
              <a href={`${zivoAdminUrl}/#travel-ops`}>Admin queue</a>
              <a className="primary" href={localUrl("/trips")}>
                Continue booking
                <ArrowRight size={16} />
              </a>
            </div>
          </section>
        )}
      <header className="topbar" aria-label="Zivo Travel navigation">
        <a className="brand" href={localUrl("/")} aria-label="Zivo Travel home">
          <span className="brand-mark">Z</span>
          <span className="brand-text">
            <strong>Zivo</strong>
            <small>Travel</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {navLinks.map(({ label, href }) => {
            const active = isPrimaryNavActive(label, href);

            return (
              <a
                key={label}
                className={active ? "active" : ""}
                href={localUrl(href)}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <div className="utility-nav">
          <a className="pill" href={engineOrigin} aria-label="Continue with Zivosmedia">
            <Link2 size={16} />
            Continue with Zivosmedia
          </a>
          <a
            className="pill"
            href={chatOrigin}
            target="_blank"
            rel="noreferrer"
            aria-label="Get support on ZivoChat"
          >
            <Headphones size={16} />
            ZivoChat
          </a>
          <div className="currency-menu">
            <button
              className={`pill ${currencyOpen ? "active" : ""}`}
              type="button"
              aria-label="Choose currency"
              aria-expanded={currencyOpen}
              aria-controls="currency-options"
              onClick={() => {
                setNotificationsOpen(false);
                setAppSwitcherOpen(false);
                setCurrencyOpen((open) => !open);
              }}
            >
              <Globe2 size={16} />
              {currency}
              <ChevronDown size={14} />
            </button>
            {currencyOpen ? (
              <div id="currency-options" className="currency-panel" role="menu">
                {currencyOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={option.code === currency ? "active" : ""}
                    role="menuitemradio"
                    aria-checked={option.code === currency}
                    onClick={() => {
                      setCurrency(option.code);
                      setCurrencyOpen(false);
                    }}
                  >
                    <span>{option.code}</span>
                    <small>{option.label}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <a
            className={`pill ${path === "/trips" || path === "/my-trips" ? "active" : ""}`}
            href={localUrl("/trips")}
            aria-current={path === "/trips" || path === "/my-trips" ? "page" : undefined}
          >
            <UserRound size={16} />
            My trips
            {savedTripCount ? <span className="pill-count">{savedTripCount}</span> : null}
          </a>
          <a
            className={`pill ${path === "/wallet" || path === "/travel/wallet" ? "active" : ""}`}
            href={localUrl("/wallet")}
            aria-current={path === "/wallet" || path === "/travel/wallet" ? "page" : undefined}
          >
            <WalletCards size={16} />
            Wallet
          </a>
          <a
            className={`pill ${supportRoute ? "active" : ""}`}
            href={localUrl("/support")}
            aria-current={supportRoute ? "page" : undefined}
          >
            <Headphones size={16} />
            Support
            {supportTicketCount ? <span className="pill-count">{supportTicketCount}</span> : null}
          </a>
          <button
            className={`icon-btn ${notificationsOpen ? "active" : ""}`}
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="travel-notifications"
            onClick={() => {
              setCurrencyOpen(false);
              setAppSwitcherOpen(false);
              setNotificationsOpen((open) => !open);
            }}
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>
          <div className="app-menu">
            <button
              className={`icon-btn ${appSwitcherOpen ? "active" : ""}`}
              type="button"
              aria-label="Switch ZIVO app"
              aria-expanded={appSwitcherOpen}
              onClick={() => {
                setCurrencyOpen(false);
                setNotificationsOpen(false);
                setAppSwitcherOpen((open) => !open);
              }}
            >
              <LayoutGrid size={18} aria-hidden="true" />
            </button>
            {appSwitcherOpen ? (
              <div className="app-panel" role="menu" aria-label="ZIVO apps">
                <div className="app-panel-header">
                  <strong>ZIVO apps</strong>
                  <small>One account across the whole network</small>
                </div>
                {zivoApps.map((app) => {
                  const isCurrent = app.key === "travel";
                  return isCurrent ? (
                    <div key={app.key} className="app-row current" aria-current="page">
                      <div className="app-row-body">
                        <span>{app.name}</span>
                        <small>{app.tagline}</small>
                      </div>
                      <CheckCircle2 size={15} aria-hidden="true" />
                    </div>
                  ) : (
                    <a
                      key={app.key}
                      href={app.origin}
                      className="app-row"
                      role="menuitem"
                      onClick={() => setAppSwitcherOpen(false)}
                    >
                      <div className="app-row-body">
                        <span>{app.name}</span>
                        <small>{app.tagline}</small>
                      </div>
                      <ArrowRight size={14} aria-hidden="true" />
                    </a>
                  );
                })}
                <a
                  href={chatOrigin}
                  className="app-row support-row"
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  onClick={() => setAppSwitcherOpen(false)}
                >
                  <Headphones size={15} aria-hidden="true" />
                  <span>Support on ZivoChat</span>
                </a>
              </div>
            ) : null}
          </div>
          <a className="avatar" href={engineUrl("/profile")} aria-label="Profile">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              alt="Traveler profile"
            />
          </a>
          {notificationsOpen ? (
            <div id="travel-notifications" className="notification-panel" role="status">
              <strong>Travel updates</strong>
              <a href={localUrl("/trips")}>
                <ReceiptText size={17} />
                <span>
                  <b>{savedTripCount || "No"} saved drafts</b>
                  <small>{savedTripCount ? "Ready to resume checkout" : "Create a draft from any result"}</small>
                </span>
              </a>
              <a href={localUrl("/deals")}>
                <WalletCards size={17} />
                <span>
                  <b>3 bundle deals</b>
                  <small>Flight, hotel, car, and bus packages</small>
                </span>
              </a>
              <a href={localUrl("/support")}>
                <BadgeCheck size={17} />
                <span>
                  <b>Booking protection</b>
                  <small>{backendStatus?.adminQueue === "supabase_rpc" ? "Live trip monitoring is ready" : "Preview trip monitoring is active"}</small>
                </span>
              </a>
              <a href={localUrl("/wallet")}>
                <ShieldCheck size={17} />
                <span>
                  <b>{backendStatus?.walletSummary === "bridge_ready" ? "Wallet bridge ready" : "Wallet preview"}</b>
                  <small>Payments and wallet hand off to Zivos Media</small>
                </span>
              </a>
              <a href={localUrl("/support")}>
                <Headphones size={17} />
                <span>
                  <b>{supportTicketCount || "No"} support drafts</b>
                  <small>Create a local ticket before opening Zivos Media chat</small>
                </span>
              </a>
            </div>
          ) : null}
        </div>
      </header>

      {dealsRoute ? (
        <DealsPage backendStatus={backendStatus} />
      ) : tripsRoute ? (
        <TripsPage backendStatus={backendStatus} />
      ) : walletRoute ? (
        <WalletPage backendStatus={backendStatus} />
      ) : supportRoute ? (
        <SupportPage backendStatus={backendStatus} />
      ) : opsRoute ? (
        <OpsPage backendStatus={backendStatus} />
      ) : reviewKind ? (
        <BookingReview kind={reviewKind} backendStatus={backendStatus} />
      ) : routeKind ? (
        <ResultsPage kind={routeKind} backendStatus={backendStatus} />
      ) : (
        <>
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
        </>
      )}
      </main>
    </CurrencyContext.Provider>
  );
}

function serviceNote(kind: SearchKind) {
  if (kind === "hotels") {
    return "Stay search uses live hotel inventory, room count, and pay-later options.";
  }

  if (kind === "cars") {
    return "Rental search checks pickup counters, insurance-ready rates, and driver options.";
  }

  if (kind === "bus") {
    return "Bus search compares operators, seats, stations, and mobile ticketing.";
  }

  return "Search live flight fares, flexible tickets, and reward-ready options.";
}

function quantityCopy(kind: SearchKind, count: number, tripType: TripType) {
  const plural = (single: string, many: string) => (count === 1 ? single : many);

  if (kind === "hotels") {
    return {
      label: "Guests",
      value: count,
      display: `${count} ${plural("guest", "guests")}`,
      helper: `${Math.max(1, Math.ceil(count / 2))} ${plural("room", "rooms")}`
    };
  }

  if (kind === "cars") {
    return {
      label: "Drivers",
      value: count,
      display: `${count} ${plural("driver", "drivers")}`,
      helper: "Age 25+"
    };
  }

  if (kind === "bus") {
    return {
      label: "Passengers",
      value: count,
      display: `${count} ${plural("passenger", "passengers")}`,
      helper: "Reserved seats"
    };
  }

  return {
    label: "Travelers",
    value: count,
    display: `${count} ${plural("traveler", "travelers")}`,
    helper: tripType
  };
}

function searchFields(
  kind: SearchKind,
  route: typeof defaultRoute,
  tripType: TripType,
  count: number,
  dates: typeof defaultDates,
  updateRoute: (field: "from" | "to", value: string) => void,
  updateDate: (field: "depart" | "return", value: string) => void
): SearchField[] {
  const travelDates = normalizedTravelDates(dates);

  if (kind === "hotels") {
    const rooms = Math.max(1, Math.ceil(count / 2));

    return [
      {
        label: "Destination",
        value: route.to,
        helper: `${cityCode(route.to, route.toCode)} city`,
        icon: MapPinned,
        inputType: "text",
        onChange: (value) => updateRoute("to", value)
      },
      { label: "Rooms", value: `${rooms} ${rooms === 1 ? "room" : "rooms"}`, helper: `${count} ${count === 1 ? "guest" : "guests"}`, icon: BedDouble },
      {
        label: "Check in",
        value: travelDates.depart,
        helper: travelDates.departLabel,
        icon: CalendarDays,
        inputType: "date",
        onChange: (value) => updateDate("depart", value)
      },
      {
        label: "Check out",
        value: travelDates.return,
        helper: travelDates.returnLabel,
        icon: CalendarDays,
        inputType: "date",
        onChange: (value) => updateDate("return", value)
      }
    ];
  }

  if (kind === "cars") {
    return [
      {
        label: "Pick-up",
        value: route.to,
        helper: `${cityCode(route.to, route.toCode)} counter`,
        icon: MapPinned,
        inputType: "text",
        onChange: (value) => updateRoute("to", value)
      },
      {
        label: "Drop-off",
        value: route.to,
        helper: "Same location",
        icon: Car,
        inputType: "text",
        onChange: (value) => updateRoute("to", value)
      },
      {
        label: "Pick up",
        value: travelDates.depart,
        helper: "10:00 AM",
        icon: CalendarDays,
        inputType: "date",
        onChange: (value) => updateDate("depart", value)
      },
      {
        label: "Return",
        value: travelDates.return,
        helper: "10:00 AM",
        icon: Clock3,
        inputType: "date",
        onChange: (value) => updateDate("return", value)
      }
    ];
  }

  if (kind === "bus") {
    return [
      {
        label: "From",
        value: route.from,
        helper: cityCode(route.from, route.fromCode),
        icon: MapPinned,
        inputType: "text",
        onChange: (value) => updateRoute("from", value)
      },
      {
        label: "To",
        value: route.to,
        helper: cityCode(route.to, route.toCode),
        icon: MapPinned,
        inputType: "text",
        onChange: (value) => updateRoute("to", value)
      },
      {
        label: "Travel date",
        value: travelDates.depart,
        helper: travelDates.departLabel,
        icon: CalendarDays,
        inputType: "date",
        onChange: (value) => updateDate("depart", value)
      },
      { label: "Passengers", value: `${count} ${count === 1 ? "passenger" : "passengers"}`, helper: "Reserved seats", icon: UserRound }
    ];
  }

  return [
    {
      label: "From",
      value: route.from,
      helper: cityCode(route.from, route.fromCode),
      icon: MapPinned,
      inputType: "text",
      onChange: (value) => updateRoute("from", value)
    },
    {
      label: "To",
      value: route.to,
      helper: cityCode(route.to, route.toCode),
      icon: MapPinned,
      inputType: "text",
      onChange: (value) => updateRoute("to", value)
    },
    {
      label: "Depart",
      value: travelDates.depart,
      helper: travelDates.departLabel,
      icon: CalendarDays,
      inputType: "date",
      onChange: (value) => updateDate("depart", value)
    },
    {
      label: "Return",
      value: travelDates.return,
      helper: tripType === "One way" ? "Optional for one way" : travelDates.returnLabel,
      icon: CalendarDays,
      inputType: "date",
      onChange: (value) => updateDate("return", value)
    }
  ];
}

function searchPerks(kind: SearchKind) {
  if (kind === "hotels") {
    return [
      { label: "Pay later rooms", icon: CreditCard },
      { label: "Verified stays", icon: BedDouble },
      { label: "24/7 support", icon: Headphones }
    ];
  }

  if (kind === "cars") {
    return [
      { label: "Airport pickup", icon: MapPinned },
      { label: "Insurance ready", icon: ShieldCheck },
      { label: "Fast checkout", icon: CreditCard }
    ];
  }

  if (kind === "bus") {
    return [
      { label: "Seat map ready", icon: Bus },
      { label: "Mobile ticket", icon: ReceiptText },
      { label: "Instant confirm", icon: BadgeCheck }
    ];
  }

  return [
    { label: "Secure booking", icon: ShieldCheck },
    { label: "Best price guarantee", icon: BadgeCheck },
    { label: "Wallet ready", icon: WalletCards }
  ];
}

function SearchPanel({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const [activeKind, setActiveKind] = useState<SearchKind>("flights");
  const [tripType, setTripType] = useState<TripType>("Round trip");
  const [searchCount, setSearchCount] = useState(1);
  const [route, setRoute] = useState(defaultRoute);
  const [dates, setDates] = useState(defaultDates);
  const activeTab = searchTabs.find((tab) => tab.id === activeKind) || searchTabs[0];
  const ActiveIcon = activeTab.icon;
  const fields = searchFields(activeKind, route, tripType, searchCount, dates, updateRoute, updateDate);
  const showTripType = activeKind === "flights";
  const showSwap = activeKind === "flights" || activeKind === "bus";
  const perks = searchPerks(activeKind);
  const quantity = quantityCopy(activeKind, searchCount, tripType);
  const resultHref = useMemo(
    () => localUrl(buildSearchPath(activeKind, route, tripType, searchCount, dates)),
    [activeKind, route, tripType, searchCount, dates]
  );
  const backendLabel =
    backendStatus?.searchTelemetry === "supabase_insert"
      ? "Search sync ready"
      : backendStatus?.mode === "cloudflare_bridge"
        ? "Backend ready"
        : "Bridge ready";

  function updateSearchCount(delta: number) {
    setSearchCount((current) => Math.max(1, Math.min(9, current + delta)));
  }

  function updateRoute(field: "from" | "to", value: string) {
    setRoute((current) => {
      if (field === "from") {
        return {
          ...current,
          from: value,
          fromCode: cityCode(value, current.fromCode)
        };
      }

      return {
        ...current,
        to: value,
        toCode: cityCode(value, current.toCode)
      };
    });
  }

  function updateDate(field: "depart" | "return", value: string) {
    setDates((current) => ({
      ...current,
      [field]: value || current[field]
    }));
  }

  function swapRoute() {
    setRoute((current) => ({
      from: current.to,
      fromCode: current.toCode,
      to: current.from,
      toCode: current.fromCode
    }));
  }

  function resetSearch() {
    setActiveKind("flights");
    setRoute(defaultRoute);
    setDates(defaultDates);
    setSearchCount(1);
    setTripType("Round trip");
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

      {showTripType ? (
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
      ) : (
        <div className="service-note" aria-live="polite">
          <ActiveIcon size={16} />
          {serviceNote(activeKind)}
        </div>
      )}

      <div className="quantity-stepper" aria-label={`${quantity.label} selector`}>
        <div>
          <span>{quantity.label}</span>
          <strong>{quantity.display}</strong>
          <small>{quantity.helper}</small>
        </div>
        <div>
          <button
            type="button"
            aria-label={`Decrease ${quantity.label.toLowerCase()}`}
            onClick={() => updateSearchCount(-1)}
            disabled={searchCount <= 1}
          >
            <Minus size={16} />
          </button>
          <b aria-live="polite">{quantity.value}</b>
          <button
            type="button"
            aria-label={`Increase ${quantity.label.toLowerCase()}`}
            onClick={() => updateSearchCount(1)}
            disabled={searchCount >= 9}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={`flight-fields ${showSwap ? "" : "no-swap"}`}>
        <Field {...fields[0]} />
        {showSwap ? (
          <button className="swap-btn" type="button" aria-label="Swap route" onClick={swapRoute}>
            <Repeat2 size={19} />
          </button>
        ) : null}
        {fields.slice(1).map((field) => (
          <Field key={field.label} {...field} />
        ))}
      </div>

      <div className="search-perks" aria-label={`${activeTab.label} booking benefits`}>
        {perks.map(({ label, icon: Icon }) => (
          <span key={label}>
            <Icon size={15} />
            {label}
          </span>
        ))}
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
        <button className="reset-search" type="button" onClick={resetSearch}>
          <Repeat2 size={15} />
          Reset
        </button>
        <a className="primary-search" href={resultHref}>
          {activeTab.cta}
          <ArrowRight size={20} />
        </a>
      </div>
    </article>
  );
}

function FeatureHero() {
  return (
    <a className="feature-card" href={localUrl(searchTabs[0].href)} aria-label="Start booking with Zivo Travel">
      <img
        className="feature-image"
        src={heroCardImage}
        alt="Zivo Travel booking hero with temple, airplane, and balloons"
      />
      <span className="feature-depth-card" aria-hidden="true" />
      <span className="cloud one" aria-hidden="true" />
      <span className="cloud two" aria-hidden="true" />
      <span className="balloon balloon-one" aria-hidden="true" />
      <span className="balloon balloon-two" aria-hidden="true" />
      <span className="balloon balloon-three" aria-hidden="true" />
      <span className="plane-3d" aria-hidden="true">
        <span />
      </span>
      <span className="feature-benefits" aria-hidden="true">
        <span>
          <ShieldCheck size={17} />
          Trusted by millions
        </span>
        <span>
          <ShieldCheck size={17} />
          Flexible changes
        </span>
        <span>
          <ShieldCheck size={17} />
          Earn rewards
        </span>
        <span>
          <ShieldCheck size={17} />
          No hidden fees
        </span>
      </span>
    </a>
  );
}

function PopularRoutes() {
  const { currency } = useCurrency();

  return (
    <article className="popular-card">
      <SectionHeader title="Popular routes" />
      <div className="route-grid">
        {routes.map((route) => (
          <a
            key={`${route.from}-${route.to}`}
            className="route-card"
            href={localUrl(`/flights?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&start=2026-06-15&end=2026-06-18&travelers=1`)}
          >
            <img src={route.image} alt={`${route.from} to ${route.to}`} />
            <button aria-label={`Open ${route.from} route`}>
              <ArrowRight size={18} />
            </button>
            <div>
              <strong>{route.from}</strong>
              <span>{route.to}</span>
              <small>
                from <b>{money(currency, route.price)}</b>
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
          <a key={label} className="mini-service" href={localUrl(searchTabs.find((tab) => tab.label === label)?.href || "/")}>
            <Icon className={color} size={25} />
            <div>
              <strong>{label}</strong>
              <span>{body}</span>
            </div>
          </a>
        ))}
      </div>
      <a className="bundle-card" href={localUrl("/deals")}>
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
  const [trips, setTrips] = useState<SavedTrip[]>(() => readSavedTrips());
  const [activeSlide, setActiveSlide] = useState(0);
  const tripSlides = useMemo(
    () => [
      ...trips.slice(0, 3).map((trip) => {
        const Icon = serviceIcon(trip.serviceType);

        return {
          title: trip.resultTitle,
          meta: `${trip.bookingReference} • ${trip.traveler?.name || trip.status}`,
          service: serviceLabel(trip.serviceType),
          secondary: trip.persisted ? "Synced" : "Preview",
          status: trip.persisted ? "Confirmed" : "Resume",
          image: trip.serviceType === "hotels" ? tripBeachImage : trip.serviceType === "bus" ? routePhnomPenhImage : routeTokyoImage,
          href: trip.reviewUrl || "/trips",
          icon: Icon
        };
      }),
      ...defaultTripSlides
    ],
    [trips]
  );
  const currentSlide = tripSlides[activeSlide] || tripSlides[0];
  const PreviewIcon = currentSlide.icon;

  useEffect(() => {
    function refresh() {
      setTrips(readSavedTrips());
    }

    window.addEventListener(savedTripsEvent, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(savedTripsEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (activeSlide >= tripSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, tripSlides.length]);

  function showPreviousTrip() {
    setActiveSlide((index) => (index === 0 ? tripSlides.length - 1 : index - 1));
  }

  function showNextTrip() {
    setActiveSlide((index) => (index + 1) % tripSlides.length);
  }

  return (
    <article className="mytrip-card">
      <SectionHeader title="My trips" href="/trips" onPrevious={showPreviousTrip} onNext={showNextTrip} />
      <div className="trip-preview">
        <img src={currentSlide.image} alt={currentSlide.title} />
        <span>{currentSlide.status}</span>
      </div>
      <div className="trip-details">
        <strong>{currentSlide.title}</strong>
        <small>{currentSlide.meta}</small>
        <div>
          <span>
            <PreviewIcon size={15} />
            {currentSlide.service}
          </span>
          <a href={localUrl(currentSlide.href)}>View details</a>
        </div>
        <span>
          <Hotel size={15} />
          {currentSlide.secondary}
        </span>
      </div>
      <div className="pager" aria-label="Trip preview pages">
        {tripSlides.map((slide, index) => (
          <button
            key={`${slide.title}-${index}`}
            type="button"
            className={index === activeSlide ? "active" : ""}
            aria-label={`Show ${slide.title}`}
            aria-current={index === activeSlide ? "true" : undefined}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </article>
  );
}

function DealsPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const [payload, setPayload] = useState<DealsPayload>(() => fallbackDeals());
  const activePayload = payload.deals.length ? payload : fallbackDeals();
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const dealModeLabel =
    activePayload.mode === "cloudflare_deals" ? "Cloudflare packages" : "Local packages";

  useEffect(() => {
    const fallback = fallbackDeals();
    const controller = new AbortController();
    setPayload(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    fetch("/api/travel/deals", {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel deals bridge unavailable");
        }

        return response.json() as Promise<DealsPayload>;
      })
      .then((dealsPayload) => setPayload(mergeDealsWithLocalImages(dealsPayload)))
      .catch(() => {
        if (!controller.signal.aborted) {
          setPayload(fallback);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="deals-page" aria-label="Zivo Travel deals">
      <div className="deals-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <WalletCards size={25} />
          </span>
          <h1>Bundle deals</h1>
          <p>Combine flights, hotels, rental cars, and buses into one easier booking path.</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{dealModeLabel}</strong>
          <small>{activePayload.deals.length} ready deals</small>
        </div>
      </div>

      <div className="deals-grid">
        {activePayload.deals.map((deal) => (
          <article key={deal.id} className="deal-card">
            <div className="deal-image">
              <img src={deal.image || routePhnomPenhImage} alt={deal.title} />
              <span>{deal.highlight}</span>
            </div>
            <div className="deal-body">
              <div>
                <span className="provider">{dealSaveLabel(deal, currency)}</span>
                <h2>{deal.title}</h2>
                <p>{deal.body}</p>
              </div>
              <div className="deal-services" aria-label={`${deal.title} includes`}>
                {deal.services.map((kind) => {
                  const Icon = searchTabs.find((tab) => tab.id === kind)?.icon || Plane;
                  return (
                    <span key={kind}>
                      <Icon size={16} />
                      {serviceLabel(serviceType(kind))}
                    </span>
                  );
                })}
              </div>
              <div className="deal-action">
                <div>
                  <small>from</small>
                  <strong>{money(currency, deal.price)}</strong>
                </div>
                <a href={deal.reviewUrl || reviewUrl(deal.reviewKind, deal.resultId, deal.id)}>
                  Select deal
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="deals-workflow">
        <span>
          <ShieldCheck size={18} />
          Secure checkout on Zivos Media
        </span>
        <span>
          <CreditCard size={18} />
          One payment handoff
        </span>
        <span>
          <WalletCards size={18} />
          Wallet record after booking
        </span>
      </aside>
    </section>
  );
}

function TripsPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const [trips, setTrips] = useState<SavedTrip[]>(() => readSavedTrips());
  const [activeFilter, setActiveFilter] = useState<TripFilter>("all");
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const persistenceLabel =
    backendStatus?.bookingPersistence === "supabase"
      ? "Supabase sync ready"
      : backendStatus?.bookingPersistence === "supabase_insert"
        ? "Supabase draft capture"
        : "Browser drafts";
  const tripCounts = useMemo(
    () => ({
      all: trips.length,
      checkout: trips.filter((trip) => Boolean(trip.checkoutUrl)).length,
      preview: trips.filter((trip) => !trip.persisted).length,
      synced: trips.filter((trip) => trip.persisted).length
    }),
    [trips]
  );
  const filteredTrips = useMemo(() => {
    if (activeFilter === "checkout") {
      return trips.filter((trip) => Boolean(trip.checkoutUrl));
    }

    if (activeFilter === "preview") {
      return trips.filter((trip) => !trip.persisted);
    }

    if (activeFilter === "synced") {
      return trips.filter((trip) => trip.persisted);
    }

    return trips;
  }, [activeFilter, trips]);
  const activeFilterLabel = tripFilters.find((filter) => filter.id === activeFilter)?.label || "All";

  function clearTrips() {
    writeSavedTrips([]);
    setTrips([]);
    setActiveFilter("all");
  }

  useEffect(() => {
    function refresh() {
      setTrips(readSavedTrips());
    }

    window.addEventListener(savedTripsEvent, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(savedTripsEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="trips-page" aria-label="My trips">
      <div className="trips-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <UserRound size={25} />
          </span>
          <h1>My trips</h1>
          <p>Resume booking drafts, checkout handoffs, and wallet-ready travel records from this browser.</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{persistenceLabel}</strong>
          <small>{trips.length} saved</small>
        </div>
      </div>

      <div className="trips-layout">
        <div className="trips-list">
          {trips.length ? (
            <div className="trip-filter-bar" role="tablist" aria-label="Trip filters">
              {tripFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={filter.id === activeFilter ? "active" : ""}
                  role="tab"
                  aria-selected={filter.id === activeFilter}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                  <span>{tripCounts[filter.id]}</span>
                </button>
              ))}
            </div>
          ) : null}

          {filteredTrips.length ? (
            filteredTrips.map((trip) => {
              const Icon = serviceIcon(trip.serviceType);

              return (
                <article key={trip.bookingReference} className="trip-row">
                  <span className="trip-row-icon">
                    <Icon size={25} />
                  </span>
                  <div className="trip-row-main">
                    <span className="provider">{trip.provider}</span>
                    <h2>{trip.resultTitle}</h2>
                    <p>
                      {trip.bookingReference} • {serviceLabel(trip.serviceType)} • {trip.status}
                    </p>
                    <small className="trip-traveler">{travelerSummary(trip.traveler)}</small>
                    <div className="result-tags">
                      <span>{trip.persisted ? "Supabase intent" : "Preview draft"}</span>
                      <span>{trip.mode.replace(/_/g, " ")}</span>
                      {trip.traveler?.preference ? <span>{trip.traveler.preference}</span> : null}
                    </div>
                  </div>
                  <div className="trip-row-price">
                    <small>Total</small>
                    <strong>{money(currency, trip.total)}</strong>
                    <div>
                      <a href={localUrl(trip.reviewUrl)}>
                        Review
                        <ArrowRight size={16} />
                      </a>
                      <a href={trip.checkoutUrl}>
                        Resume
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          ) : trips.length ? (
            <article className="empty-trips">
              <span>
                <Search size={28} />
              </span>
              <h2>No {activeFilterLabel.toLowerCase()} trips</h2>
              <p>Try another filter or create a new booking draft from any travel result.</p>
              <a href={localUrl("/")}>
                New search
                <ArrowRight size={18} />
              </a>
            </article>
          ) : (
            <article className="empty-trips">
              <span>
                <ReceiptText size={28} />
              </span>
              <h2>No saved trip drafts yet</h2>
              <p>Create a booking draft from any result page and it will appear here for quick checkout resume.</p>
              <a href={localUrl(searchTabs[3].href)}>
                Start with bus
                <ArrowRight size={18} />
              </a>
            </article>
          )}
        </div>

        <aside className="trips-aside">
          <h2>Trip workflow</h2>
          <p>Saved drafts keep the customer journey connected while checkout, payment, wallet, and payout records stay on Zivos Media.</p>
          <div>
            <span>
              <ReceiptText size={16} />
              {tripCounts.all} saved drafts
            </span>
            <span>
              <CreditCard size={16} />
              {tripCounts.checkout} checkout ready
            </span>
            <span>
              <WalletCards size={16} />
              {tripCounts.synced} synced records
            </span>
          </div>
          <a href={localUrl("/")}>
            New search
            <ArrowRight size={18} />
          </a>
          {trips.length ? (
            <button type="button" onClick={clearTrips}>
              Clear saved drafts
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function walletReasonLabel(summary: WalletSummaryPayload) {
  if (summary.reason === "missing_supabase_service_role_secret") {
    return "Waiting for dedicated wallet secret";
  }

  if (summary.reason === "local_preview") {
    return "Local payment preview";
  }

  return summary.reason ? formatMode(summary.reason) : "Zivos Media handoff ready";
}

function WalletPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const [summary, setSummary] = useState<WalletSummaryPayload>(() => fallbackWalletSummary());
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const activeSummary = summary.methods.length ? summary : fallbackWalletSummary();
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const walletLabel = activeSummary.persisted ? "Wallet bridge" : "Preview wallet";
  const totalFunds = activeSummary.available + activeSummary.pending + activeSummary.rewards;

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackWalletSummary();
    setSummary(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    setLoading(true);
    fetch("/api/travel/wallet/summary", {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel wallet summary unavailable");
        }

        return response.json() as Promise<WalletSummaryPayload>;
      })
      .then((walletSummary) => setSummary(walletSummary))
      .catch(() => {
        if (!controller.signal.aborted) {
          setSummary(fallback);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [refreshToken]);

  return (
    <section className="wallet-page" aria-label="Travel wallet">
      <div className="wallet-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <WalletCards size={25} />
          </span>
          <h1>Travel wallet</h1>
          <p>Payments, payout timing, cash-out status, and checkout handoffs stay connected with Zivos Media.</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{walletLabel}</strong>
          <small>{new Date(activeSummary.checkedAt).toLocaleString()}</small>
        </div>
      </div>

      <div className="wallet-layout">
        <div className="wallet-main">
          <article className="wallet-balance-card">
            <div>
              <span>Available for cash out</span>
              <strong>{money(currency, activeSummary.available)}</strong>
              <p>{walletReasonLabel(activeSummary)}</p>
            </div>
            <div className="wallet-card-chip">
              <span>Zivo</span>
              <b>Travel</b>
            </div>
          </article>

          <div className="wallet-metrics" aria-label="Wallet metrics">
            <article>
              <span>Total tracked</span>
              <strong>{money(currency, totalFunds)}</strong>
              <small>Balance + pending + rewards</small>
            </article>
            <article>
              <span>Pending payout</span>
              <strong>{money(currency, activeSummary.pending)}</strong>
              <small>Releases after checkout</small>
            </article>
            <article>
              <span>Rewards</span>
              <strong>{money(currency, activeSummary.rewards)}</strong>
              <small>Ready for next booking</small>
            </article>
          </div>

          <div className="wallet-grid">
            <article className="wallet-panel">
              <div className="wallet-panel-head">
                <div>
                  <h2>Payment methods</h2>
                  <p>Choose how customers pay before the Zivos Media checkout handoff.</p>
                </div>
                <a href={activeSummary.links.paymentMethods}>
                  Manage
                  <ArrowRight size={16} />
                </a>
              </div>
              <div className="wallet-list">
                {activeSummary.methods.map((method) => (
                  <div key={method.id}>
                    <span>
                      <CreditCard size={17} />
                    </span>
                    <div>
                      <strong>{method.label}</strong>
                      <small>{method.detail}</small>
                    </div>
                    <b>{method.status}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="wallet-panel">
              <div className="wallet-panel-head">
                <div>
                  <h2>Payouts</h2>
                  <p>Cash-out and settlement records stay visible before final wallet sync.</p>
                </div>
                <a href={activeSummary.links.payout}>
                  Cash out
                  <ArrowRight size={16} />
                </a>
              </div>
              <div className="wallet-list payout-list">
                {activeSummary.payouts.map((payout) => (
                  <div key={payout.id}>
                    <span>
                      <Landmark size={17} />
                    </span>
                    <div>
                      <strong>{payout.label}</strong>
                      <small>
                        {payout.status} • {payout.eta}
                      </small>
                    </div>
                    <b>{money(currency, payout.amount)}</b>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <aside className="wallet-aside">
          <h2>Wallet workflow</h2>
          <p>Zivo Travel keeps the booking context visible, then sends protected payment, wallet, payout, and support actions to Zivos Media.</p>
          <div className="wallet-chain">
            <span>
              <ReceiptText size={16} />
              Booking draft
            </span>
            <span>
              <CreditCard size={16} />
              Pay
            </span>
            <span>
              <WalletCards size={16} />
              Wallet ledger
            </span>
            <span>
              <Landmark size={16} />
              Cash out
            </span>
          </div>
          <button type="button" onClick={() => setRefreshToken((token) => token + 1)} disabled={loading}>
            <Repeat2 size={17} />
            {loading ? "Refreshing" : "Refresh wallet"}
          </button>
          <a href={activeSummary.links.wallet}>
            Open Zivos Media wallet
            <ArrowRight size={16} />
          </a>
          <a href={localUrl("/support")}>
            Support handoff
            <ArrowRight size={16} />
          </a>
        </aside>
      </div>
    </section>
  );
}

function supportReasonLabel(response: SupportTicketResponse | null) {
  if (!response) {
    return "Ready for travel support";
  }

  if (response.reason === "missing_supabase_service_role_secret" || response.reason === "missing_supabase_write_key") {
    return "Waiting for support table key";
  }

  if (response.reason === "missing_support_persistence") {
    return "Preview saved for chat handoff";
  }

  if (response.reason === "supabase_support_insert_failed") {
    return "Preview saved after sync issue";
  }

  if (response.reason === "local_preview") {
    return "Saved in this browser";
  }

  return response.persisted ? "Support ticket synced" : response.reason ? formatMode(response.reason) : "Support draft ready";
}

function SupportPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const [form, setForm] = useState<SupportForm>(() => defaultSupportForm());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => readSupportTickets());
  const [lastResponse, setLastResponse] = useState<SupportTicketResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTopic = supportTopics.find((topic) => topic.id === form.topic) || supportTopics[0];
  const TopicIcon = activeTopic.icon;
  const latestTicket = lastResponse?.ticket || tickets[0] || null;
  const bridgeLabel =
    backendStatus?.supportPersistence === "supabase_insert" || backendStatus?.supportPersistence === "supabase"
      ? "Support sync ready"
      : backendStatus?.mode === "cloudflare_bridge"
        ? "Live bridge"
        : "Local preview";
  const supportLabel = lastResponse
    ? lastResponse.persisted
      ? "Supabase ticket"
      : "Preview ticket"
    : tickets.length
      ? "Local tickets"
      : "Support center";

  function updateForm(field: keyof SupportForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearSupportDrafts() {
    writeSupportTickets([]);
    setTickets([]);
    setLastResponse(null);
    setError(null);
  }

  useEffect(() => {
    function refreshSupportTickets() {
      setTickets(readSupportTickets());
    }

    window.addEventListener(supportTicketsEvent, refreshSupportTickets);
    window.addEventListener("storage", refreshSupportTickets);

    return () => {
      window.removeEventListener(supportTicketsEvent, refreshSupportTickets);
      window.removeEventListener("storage", refreshSupportTickets);
    };
  }, []);

  async function createSupportDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const details = sanitizeSupportForm(form);
    setForm(details);
    setSaving(true);
    setError(null);

    if (!canUseTravelApi()) {
      const response = localSupportTicket(details);
      saveSupportTicket(response);
      setLastResponse(response);
      setTickets(readSupportTickets());
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/travel/support", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify(details)
      });

      if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
        throw new Error("Support bridge unavailable");
      }

      const ticketResponse = await response.json() as SupportTicketResponse;
      saveSupportTicket(ticketResponse);
      setLastResponse(ticketResponse);
      setTickets(readSupportTickets());
    } catch {
      const response = localSupportTicket(details);
      saveSupportTicket(response);
      setLastResponse(response);
      setTickets(readSupportTickets());
      setError("Preview ticket created");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="support-page" aria-label="Zivo Travel support">
      <div className="support-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <Headphones size={25} />
          </span>
          <h1>Travel support</h1>
          <p>Capture booking context, create a support draft, then continue in Zivos Media chat with the same ticket reference.</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{supportLabel}</strong>
          <small>{tickets.length} saved</small>
        </div>
      </div>

      <div className="support-layout">
        <div className="support-main">
          <div className="support-topic-grid" role="tablist" aria-label="Support topic">
            {supportTopics.map(({ id, label, body, priority, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={id === form.topic ? "active" : ""}
                role="tab"
                aria-selected={id === form.topic}
                onClick={() => updateForm("topic", id)}
              >
                <span>
                  <Icon size={18} />
                </span>
                <strong>{label}</strong>
                <small>{body}</small>
                <b>{priority}</b>
              </button>
            ))}
          </div>

          <article className="support-form-card">
            <div className="support-card-head">
              <span>
                <TopicIcon size={20} />
              </span>
              <div>
                <h2>Create support draft</h2>
                <p>{activeTopic.body}</p>
              </div>
            </div>

            <form className="support-form" onSubmit={createSupportDraft}>
              <label>
                Name
                <input
                  type="text"
                  value={form.name}
                  autoComplete="name"
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  placeholder="customer@example.com"
                  onChange={(event) => updateForm("email", event.target.value)}
                />
              </label>
              <label>
                Booking reference
                <input
                  type="text"
                  value={form.bookingReference}
                  placeholder="ztb_..."
                  onChange={(event) => updateForm("bookingReference", event.target.value)}
                />
              </label>
              <label className="support-message">
                Message
                <textarea
                  value={form.message}
                  rows={5}
                  onChange={(event) => updateForm("message", event.target.value)}
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Creating draft" : "Create support draft"}
                <ArrowRight size={18} />
              </button>
              {error ? <small className="support-error">{error}</small> : null}
            </form>

            {latestTicket ? (
              <div className="support-confirmation" aria-live="polite">
                <div>
                  <span>Latest ticket</span>
                  <strong>{latestTicket.reference}</strong>
                  <small>{supportReasonLabel(lastResponse)} • {supportTopicLabel(latestTicket.topic)}</small>
                </div>
                <a href={latestTicket.chatUrl}>
                  Open chat
                  <ArrowRight size={16} />
                </a>
              </div>
            ) : null}
          </article>

          <article className="support-ticket-list">
            <div className="support-card-head">
              <span>
                <ReceiptText size={20} />
              </span>
              <div>
                <h2>Recent support drafts</h2>
                <p>Local references stay visible until the Zivos Media chat handoff is completed.</p>
              </div>
              {tickets.length ? (
                <button className="support-clear" type="button" onClick={clearSupportDrafts}>
                  Clear drafts
                </button>
              ) : null}
            </div>
            {tickets.length ? (
              <div className="support-ticket-rows">
                {tickets.slice(0, 5).map((ticket) => (
                  <a key={ticket.reference} href={ticket.chatUrl}>
                    <span>
                      <Headphones size={17} />
                    </span>
                    <div>
                      <strong>{ticket.reference}</strong>
                      <small>{ticket.customer} • {supportTopicLabel(ticket.topic)}</small>
                    </div>
                    <b>{ticket.priority}</b>
                  </a>
                ))}
              </div>
            ) : (
              <p className="support-empty">No support drafts yet. Create one with a booking reference or customer email.</p>
            )}
          </article>
        </div>

        <aside className="support-aside">
          <h2>Support workflow</h2>
          <p>Zivo Travel keeps the trip context first, then hands the conversation to Zivos Media for account, payment, wallet, and operator follow-up.</p>
          <div className="support-chain">
            <span>
              <ReceiptText size={16} />
              Trip context
            </span>
            <span>
              <Headphones size={16} />
              Support draft
            </span>
            <span>
              <Link2 size={16} />
              Zivos Media chat
            </span>
            <span>
              <WalletCards size={16} />
              Wallet follow-up
            </span>
          </div>
          <a href={latestTicket?.chatUrl || supportChatUrl()}>
            Open Zivos Media chat
            <ArrowRight size={16} />
          </a>
          <a href={localUrl("/trips")}>
            My trips
            <ArrowRight size={16} />
          </a>
          <a href={localUrl("/wallet")}>
            Wallet
            <ArrowRight size={16} />
          </a>
        </aside>
      </div>
    </section>
  );
}

function riskClass(risk: string) {
  return risk.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatQueueTime(value: string) {
  if (!value || value === "Preview") {
    return value || "Preview";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function queueReasonLabel(payload: AdminQueuePayload) {
  if (payload.reason === "missing_supabase_service_role_secret") {
    return "Waiting for Supabase service-role secret";
  }

  if (payload.reason === "supabase_rpc_failed") {
    return `Supabase returned ${payload.supabaseStatus || "an error"}`;
  }

  if (payload.reason === "local_preview") {
    return "Local preview rows";
  }

  return payload.reason ? formatMode(payload.reason) : "Live queue connected";
}

function OpsPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const [payload, setPayload] = useState<AdminQueuePayload>(() => fallbackAdminQueue());
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => readSavedTrips());
  const activePayload = payload.queue.length ? payload : fallbackAdminQueue();
  const queue = activePayload.queue;
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const queueLabel = activePayload.persisted
    ? "Supabase queue"
    : activePayload.reason === "missing_supabase_service_role_secret"
      ? "Preview queue"
      : "Local queue";
  const pendingCount = queue.filter((row) => !/(paid|complete|confirmed)/i.test(row.status)).length;
  const riskCount = queue.filter((row) => row.risk.toLowerCase() !== "low").length;

  useEffect(() => {
    function refreshTrips() {
      setSavedTrips(readSavedTrips());
    }

    window.addEventListener(savedTripsEvent, refreshTrips);
    window.addEventListener("storage", refreshTrips);

    return () => {
      window.removeEventListener(savedTripsEvent, refreshTrips);
      window.removeEventListener("storage", refreshTrips);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackAdminQueue();
    setPayload(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    setLoading(true);
    fetch("/api/travel/admin/queue?limit=8", {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel operations queue unavailable");
        }

        return response.json() as Promise<AdminQueuePayload>;
      })
      .then((adminPayload) => setPayload(adminPayload))
      .catch(() => {
        if (!controller.signal.aborted) {
          setPayload(fallback);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [refreshToken]);

  return (
    <section className="ops-page" aria-label="Travel operations">
      <div className="ops-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <ReceiptText size={25} />
          </span>
          <h1>Travel ops queue</h1>
          <p>Monitor pending travel handoffs across flights, hotels, rental cars, and buses.</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{queueLabel}</strong>
          <small>{new Date(activePayload.checkedAt).toLocaleString()}</small>
        </div>
      </div>

      <div className="ops-layout">
        <div className="ops-main">
          <div className="ops-metrics" aria-label="Operations metrics">
            <article>
              <span>Queue</span>
              <strong>{queue.length}</strong>
              <small>{formatMode(activePayload.mode)}</small>
            </article>
            <article>
              <span>Pending</span>
              <strong>{pendingCount}</strong>
              <small>Needs checkout follow-up</small>
            </article>
            <article>
              <span>Risk</span>
              <strong>{riskCount}</strong>
              <small>Medium or high review</small>
            </article>
            <article>
              <span>Drafts</span>
              <strong>{savedTrips.length}</strong>
              <small>Saved in this browser</small>
            </article>
          </div>

          <article className="ops-table-card">
            <div className="ops-table-head">
              <div>
                <h2>Pending handoffs</h2>
                <p>{queueReasonLabel(activePayload)}</p>
              </div>
              <button type="button" onClick={() => setRefreshToken((token) => token + 1)} disabled={loading}>
                <Repeat2 size={17} />
                {loading ? "Refreshing" : "Refresh"}
              </button>
            </div>

            <div className="ops-table" role="table" aria-label="Pending travel queue">
              <div className="ops-table-row ops-table-labels" role="row">
                <span>Customer</span>
                <span>Product</span>
                <span>Route</span>
                <span>Status</span>
                <span>Amount</span>
                <span>Risk</span>
                <span>Updated</span>
              </div>
              {queue.map((row) => (
                <div key={row.id} className="ops-table-row" role="row">
                  <span>
                    <strong>{row.customer}</strong>
                    <small>{row.id}</small>
                  </span>
                  <span>{row.product}</span>
                  <span>{row.route}</span>
                  <span>{row.status}</span>
                  <span>{formatAmountText(row.amount, currency)}</span>
                  <span>
                    <b className={`risk-pill risk-${riskClass(row.risk)}`}>{row.risk}</b>
                  </span>
                  <span>{formatQueueTime(row.lastUpdate)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="ops-aside">
          <h2>Backend workflow</h2>
          <p>Search, deal, and booking drafts start on Zivo Travel, then checkout, wallet, payout, and support stay connected through Zivos Media.</p>
          <div className="ops-chain">
            <span>
              <Search size={16} />
              Travel search
            </span>
            <span>
              <ReceiptText size={16} />
              Queue review
            </span>
            <span>
              <CreditCard size={16} />
              Checkout
            </span>
            <span>
              <WalletCards size={16} />
              Wallet
            </span>
          </div>
          <div className="ops-links">
            <a href={localUrl("/trips")}>
              Saved trips
              <ArrowRight size={16} />
            </a>
            <a href={localUrl("/deals")}>
              Bundle deals
              <ArrowRight size={16} />
            </a>
            <a href={engineUrl(bridge.routing.wallet)}>
              Zivos Media wallet
              <ArrowRight size={16} />
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ResultsPage({ kind, backendStatus }: { kind: SearchKind; backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const searchContext = useMemo(() => readSearchContext(kind), [kind]);
  const [payload, setPayload] = useState<ResultsPayload>(() => fallbackResults(kind));
  const activePayload = payload.product === kind ? payload : fallbackResults(kind);
  const activeTab = searchTabs.find((tab) => tab.id === kind) || searchTabs[0];
  const Icon = activeTab.icon;
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const displayLabel = contextualResultLabel(kind, searchContext);
  const displaySummary = contextualResultSummary(kind, searchContext, activePayload.results.length);
  const displayResults = activePayload.results.map((result) => contextualizeResultItem(kind, result, searchContext));

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackResults(kind);
    setPayload(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    const params = resultRequestParams(kind, searchContext);

    fetch(`/api/travel/results?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel results bridge unavailable");
        }

        return response.json() as Promise<ResultsPayload>;
      })
      .then((results) => setPayload(results))
      .catch(() => {
        if (!controller.signal.aborted) {
          setPayload(fallback);
        }
      });

    return () => controller.abort();
  }, [kind, searchContext.count, searchContext.end, searchContext.from, searchContext.rooms, searchContext.start, searchContext.to, searchContext.tripType]);

  return (
    <section className="results-page" aria-label={`${activeTab.label} results`}>
      <div className="results-hero">
        <div>
          <a className="back-link" href={localUrl("/")}>
            <ChevronLeft size={17} />
            Search
          </a>
          <span className="results-icon">
            <Icon size={25} />
          </span>
          <h1>{displayLabel}</h1>
          <p>{displaySummary}</p>
        </div>
        <div className="results-status">
          <span>{bridgeLabel}</span>
          <strong>{formatMode(activePayload.mode)}</strong>
          <small>{activePayload.provider}</small>
        </div>
      </div>

      <nav className="results-tabs" aria-label="Travel result types">
        {searchTabs.map(({ id, label, icon: TabIcon, href }) => (
          <a key={id} className={id === kind ? "active" : ""} href={localUrl(href)}>
            <TabIcon size={18} />
            {label}
          </a>
        ))}
      </nav>

      <div className="results-context" aria-label="Current search details">
        {searchContext.chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      <div className="results-layout">
        <div className="results-list" aria-label={`${activeTab.label} options`}>
          {displayResults.map((result) => (
            <article key={result.id} className="result-card">
              <div className="result-media">
                {result.image ? (
                  <img src={result.image} alt={result.title} />
                ) : (
                  <span>
                    <Icon size={32} />
                  </span>
                )}
              </div>
              <div className="result-main">
                <div>
                  <span className="provider">{result.provider}</span>
                  <h2>{result.title}</h2>
                  <p>{result.detail}</p>
                </div>
                <div className="result-facts">
                  <span>
                    <Clock3 size={15} />
                    {result.time}
                  </span>
                  <span>
                    <MapPinned size={15} />
                    {result.duration}
                  </span>
                  <span>
                    <BadgeCheck size={15} />
                    {result.rating}
                  </span>
                </div>
                <div className="result-tags">
                  {result.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="result-action">
                <small>from</small>
                <strong>{money(currency, result.price)}</strong>
                <a href={contextualReviewUrl(kind, result.id, searchContext)}>
                  Select
                  <ArrowRight size={17} />
                </a>
              </div>
            </article>
          ))}
        </div>

        <aside className="results-aside" aria-label="Trip checkout summary">
          <h2>Ready to book</h2>
          <p>Choose an option, then continue with secure account access, payments, wallet, and payout records on Zivos Media.</p>
          <div>
            <span>
              <ShieldCheck size={16} />
              Secure checkout
            </span>
            <span>
              <CreditCard size={16} />
              Saved payment methods
            </span>
            <span>
              <WalletCards size={16} />
              Wallet ledger
            </span>
          </div>
          <a href={contextualReviewUrl(kind, displayResults[0]?.id, searchContext)}>
            Continue with best option
            <ArrowRight size={18} />
          </a>
        </aside>
      </div>
    </section>
  );
}

function BookingReview({ kind, backendStatus }: { kind: SearchKind; backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
  const searchParams = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const resultId = searchParams?.get("result") || null;
  const dealId = searchParams?.get("deal") || null;
  const searchContext = useMemo(() => readSearchContext(kind), [kind]);
  const [session, setSession] = useState<ReviewSession>(() => fallbackReviewSession(kind, resultId, dealId));
  const rawSession = session.product === kind ? session : fallbackReviewSession(kind, resultId, dealId);
  const activeSession = useMemo(
    () => contextualizeReviewSession(rawSession, kind, searchContext),
    [
      rawSession,
      kind,
      searchContext.count,
      searchContext.end,
      searchContext.from,
      searchContext.rooms,
      searchContext.start,
      searchContext.to,
      searchContext.tripType
    ]
  );
  const activeTab = searchTabs.find((tab) => tab.id === kind) || searchTabs[0];
  const Icon = activeTab.icon;
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live handoff" : "Local preview";
  const [bookingIntent, setBookingIntent] = useState<BookingIntentResponse | null>(null);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [traveler, setTraveler] = useState<TravelerDetails>(defaultTravelerDetails);
  const bookingHref = bookingIntent?.booking.checkoutUrl || activeSession.checkoutUrl;
  const bookingModeLabel = bookingIntent
    ? bookingIntent.persisted
      ? "Saved in Supabase"
      : "Preview draft"
    : "Not saved yet";
  const reviewTags = activeSession.deal
    ? [
        dealSaveLabel(activeSession.deal, currency),
        ...activeSession.result.tags.filter((tag) => tag !== activeSession.deal?.save)
      ]
    : activeSession.result.tags;
  const reviewLedger = activeSession.ledger.map((item) =>
    item.label === "Package" && activeSession.deal
      ? { ...item, value: `${dealSaveLabel(activeSession.deal, currency)} bundle` }
      : item
  );

  function updateTraveler(field: keyof TravelerDetails, value: string) {
    setTraveler((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackReviewSession(kind, resultId, dealId);
    setSession(fallback);
    setBookingIntent(null);
    setBookingError(null);
    setTraveler(defaultTravelerDetails);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    const params = resultRequestParams(kind, searchContext);

    if (resultId) {
      params.set("result", resultId);
    }

    if (dealId) {
      params.set("deal", dealId);
    }

    fetch(`/api/travel/session?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
          throw new Error("Travel review session unavailable");
        }

        return response.json() as Promise<ReviewSession>;
      })
      .then((payload) => setSession(payload))
      .catch(() => {
        if (!controller.signal.aborted) {
          setSession(fallback);
        }
    });

    return () => controller.abort();
  }, [kind, resultId, dealId, searchContext.count, searchContext.end, searchContext.from, searchContext.rooms, searchContext.start, searchContext.to, searchContext.tripType]);

  async function createBookingDraft() {
    if (bookingSaving) {
      return bookingIntent || localBookingIntent(activeSession, kind, traveler);
    }

    setBookingSaving(true);
    setBookingError(null);
    const travelerDetails = sanitizeTravelerDetails(traveler);

    if (!canUseTravelApi()) {
      const intent = localBookingIntent(activeSession, kind, travelerDetails);
      saveBookingIntent(intent, travelerDetails);
      setBookingIntent(intent);
      setBookingSaving(false);
      return intent;
    }

    const params = resultRequestParams(kind, searchContext);
    params.set("result", activeSession.result.id);

    if (activeSession.deal?.id) {
      params.set("deal", activeSession.deal.id);
    }

    try {
      const response = await fetch(`/api/travel/bookings?${params.toString()}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          type: kind,
          resultId: activeSession.result.id,
          dealId: activeSession.deal?.id,
          traveler: travelerDetails
        })
      });

      if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
        throw new Error("Booking draft unavailable");
      }

      const intent = await response.json() as BookingIntentResponse;
      saveBookingIntent(intent, travelerDetails);
      setBookingIntent(intent);
      return intent;
    } catch (error) {
      const intent = localBookingIntent(activeSession, kind, travelerDetails);
      saveBookingIntent(intent, travelerDetails);
      setBookingIntent(intent);
      setBookingError("Preview draft created");
      return intent;
    } finally {
      setBookingSaving(false);
    }
  }

  async function handleCheckout(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const intent = bookingIntent || await createBookingDraft();
    window.location.href = intent.booking.checkoutUrl;
  }

  return (
    <section className="review-page" aria-label="Booking review">
      <div className="review-hero">
        <div>
          <a className="back-link" href={resultListUrl(kind, searchContext)}>
            <ChevronLeft size={17} />
            Results
          </a>
          <span className="results-icon">
            <Icon size={25} />
          </span>
          <h1>{activeSession.label}</h1>
          <p>{activeSession.summary}</p>
        </div>
        <div className="review-status">
          <span>{bridgeLabel}</span>
          <strong>{formatMode(activeSession.mode)}</strong>
          <small>{activeSession.provider}</small>
        </div>
      </div>

      <div className="review-context" aria-label="Booking search details">
        {searchContext.chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      <div className="review-layout">
        <article className="review-card review-option">
          <div className="review-section-head">
            <span>
              <ReceiptText size={21} />
            </span>
            <div>
              <h2>Trip option</h2>
              <p>Selected on Zivo Travel, completed securely on Zivos Media.</p>
            </div>
          </div>

          <div className="review-result-row">
            <div className="result-media">
              {activeSession.result.image ? (
                <img src={activeSession.result.image} alt={activeSession.result.title} />
              ) : (
                <span>
                  <Icon size={32} />
                </span>
              )}
            </div>
            <div>
              <span className="provider">{activeSession.result.provider}</span>
              <h2>{activeSession.result.title}</h2>
              <p>{activeSession.result.detail}</p>
              <div className="result-facts">
                <span>
                  <Clock3 size={15} />
                  {activeSession.result.time}
                </span>
                <span>
                  <MapPinned size={15} />
                  {activeSession.result.duration}
                </span>
                <span>
                  <BadgeCheck size={15} />
                  {activeSession.result.rating}
                </span>
              </div>
            </div>
          </div>

          <div className="review-tags">
            {reviewTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="traveler-panel" aria-label="Traveler details">
            <div className="traveler-head">
              <span>
                <UserRound size={18} />
              </span>
              <div>
                <h3>Traveler details</h3>
                <p>Saved with this draft for checkout and support handoff.</p>
              </div>
            </div>
            <div className="traveler-grid">
              <label>
                Full name
                <input
                  type="text"
                  value={traveler.name}
                  autoComplete="name"
                  onChange={(event) => updateTraveler("name", event.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={traveler.email}
                  autoComplete="email"
                  onChange={(event) => updateTraveler("email", event.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={traveler.phone}
                  autoComplete="tel"
                  onChange={(event) => updateTraveler("phone", event.target.value)}
                />
              </label>
              <label>
                Preference
                <input
                  type="text"
                  value={traveler.preference}
                  onChange={(event) => updateTraveler("preference", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="review-steps">
            {activeSession.steps.map((step, index) => (
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

        <aside className="review-card review-checkout" aria-label="Checkout summary">
          <div className="review-section-head">
            <span>
              <ShieldCheck size={21} />
            </span>
            <div>
              <h2>Checkout summary</h2>
              <p>Account, payment, wallet, and payout records stay connected.</p>
            </div>
          </div>

          <div className="price-breakdown">
            <div>
              <span>Subtotal</span>
              <strong>{money(currency, activeSession.subtotal)}</strong>
            </div>
            <div>
              <span>Service fee</span>
              <strong>{money(currency, activeSession.serviceFee)}</strong>
            </div>
            <div>
              <span>Total due</span>
              <strong>{money(currency, activeSession.total)}</strong>
            </div>
          </div>

          <div className={`booking-record ${bookingIntent?.persisted ? "persisted" : ""}`}>
            <span>Booking draft</span>
            <strong>{bookingIntent?.booking.bookingReference || "Not saved yet"}</strong>
            <p>{bookingModeLabel}</p>
            <button type="button" onClick={createBookingDraft} disabled={bookingSaving}>
              {bookingSaving ? "Saving draft" : bookingIntent ? "Refresh draft" : "Create booking draft"}
            </button>
            {bookingError ? <small>{bookingError}</small> : null}
          </div>

          <a className="checkout-link" href={bookingHref} onClick={handleCheckout}>
            Continue secure checkout
            <ArrowRight size={18} />
          </a>

          <div className="review-actions">
            <a href={activeSession.ssoUrl}>
              <LockKeyhole size={16} />
              SSO handoff
            </a>
            <a href={activeSession.paymentUrl}>
              <CreditCard size={16} />
              Payment methods
            </a>
            <a href={activeSession.walletUrl}>
              <WalletCards size={16} />
              Wallet
            </a>
            <a href={activeSession.payoutUrl}>
              <Landmark size={16} />
              Payout ledger
            </a>
          </div>

          <div className="ledger-list">
            {reviewLedger.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function BookingWorkflow({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const { currency } = useCurrency();
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
          <strong>{money(currency, activeQuote.total)}</strong>
        </div>
        <a className="checkout-link" href={reviewUrl(activeKind)}>
          Review booking
          <ArrowRight size={18} />
        </a>
      </article>

      <article className="workflow-panel">
        <div className="workflow-headline">
          <Search size={21} />
          <div>
            <h2>Book in five steps</h2>
            <p>{connectionMode === "Cloudflare bridge" ? "Live booking path" : "Preview booking path"}</p>
          </div>
        </div>
        <div className="step-chain">
          {activeQuote.steps.map((step, index) => (
            <div key={step.label} className={index < 2 ? "complete" : ""}>
              <span>
                <CheckCircle2 size={16} />
              </span>
              <strong>{workflowStepLabel(step.label)}</strong>
              <small>{workflowStatusCopy(step.status)}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="workflow-panel connection-panel">
        <div className="workflow-headline">
          <Link2 size={21} />
          <div>
            <h2>Everything follows you</h2>
            <p>Trips, payments, wallet, and support stay connected.</p>
          </div>
        </div>
        <div className="connection-grid">
          {connectionItems.map(({ key, label, value, icon: Icon }) => (
            <a
              key={label}
              href={
                key === "account"
                  ? activeQuote.ssoUrl
                  : key === "payment"
                    ? activeQuote.paymentUrl
                    : key === "wallet"
                      ? activeQuote.walletUrl
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
  helper,
  inputType,
  onChange
}: {
  icon?: typeof CalendarDays;
  label: string;
  value: string;
  helper?: string;
  inputType?: "text" | "date";
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`field ${onChange ? "field-editable" : ""}`}>
      <span>{label}</span>
      {onChange ? (
        <input
          type={inputType || "text"}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <strong>{value}</strong>
      )}
      {helper ? <small>{helper}</small> : null}
      {Icon ? <Icon size={16} /> : null}
    </label>
  );
}

function SectionHeader({
  title,
  href = searchTabs[0].href,
  onPrevious,
  onNext
}: {
  title: string;
  href?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <div>
        <a href={localUrl(href)}>View all</a>
        <button type="button" aria-label="Previous" onClick={onPrevious}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" aria-label="Next" onClick={onNext}>
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
