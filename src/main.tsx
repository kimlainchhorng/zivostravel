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
  Link2,
  LockKeyhole,
  MapPinned,
  Plane,
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

type SearchKind = "flights" | "hotels" | "cars" | "bus";
type TripType = "Round trip" | "One way" | "Multi-city";
type BackendStatus = {
  mode: string;
  platformOrigin: string;
  travelSupabaseUrl?: string;
  authoritySupabaseUrl?: string;
  dedicatedBackendEnabled?: boolean;
  bookingPersistence?: string;
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
};
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

const savedTripsKey = "zivo-travel-booking-drafts";
const savedTripsEvent = "zivo-travel-bookings-updated";

const routes = [
  {
    from: "Phnom Penh",
    to: "Siem Reap",
    price: "$48",
    image: routePhnomPenhImage
  },
  {
    from: "New York",
    to: "United States",
    price: "$499",
    image: routeNewYorkImage
  },
  {
    from: "Tokyo",
    to: "Japan",
    price: "$799",
    image: routeTokyoImage
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

const dealPackages: DealPackage[] = [
  {
    id: "angkor-flight-hotel",
    title: "Angkor weekend bundle",
    body: "Flight + hotel for a three-night Siem Reap escape with flexible change support.",
    price: 168,
    save: "Save $28",
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

function currentPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
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
  const routeKind = currentRouteKind();
  const reviewKind = currentReviewKind();
  const tripsRoute = isTripsRoute();
  const dealsRoute = isDealsRoute();
  const path = currentPath();

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
          <a className="pill" href={engineUrl("/zivo-travel")}>
            <Globe2 size={16} />
            USD
            <ChevronDown size={14} />
          </a>
          <a
            className={`pill ${path === "/trips" || path === "/my-trips" ? "active" : ""}`}
            href={localUrl("/trips")}
            aria-current={path === "/trips" || path === "/my-trips" ? "page" : undefined}
          >
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

      {dealsRoute ? (
        <DealsPage backendStatus={backendStatus} />
      ) : tripsRoute ? (
        <TripsPage backendStatus={backendStatus} />
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

function searchFields(kind: SearchKind, route: typeof defaultRoute, tripType: TripType): SearchField[] {
  if (kind === "hotels") {
    return [
      { label: "Destination", value: route.to, helper: "Siem Reap city", icon: MapPinned },
      { label: "Rooms", value: "1 room", helper: "1 adult", icon: BedDouble },
      { label: "Check in", value: defaultDates.departLabel, icon: CalendarDays },
      { label: "Check out", value: defaultDates.returnLabel, icon: CalendarDays }
    ];
  }

  if (kind === "cars") {
    return [
      { label: "Pick-up", value: route.to, helper: "Downtown counter", icon: MapPinned },
      { label: "Drop-off", value: route.to, helper: "Same location", icon: Car },
      { label: "Pick up", value: defaultDates.departLabel, helper: "10:00 AM", icon: CalendarDays },
      { label: "Return", value: defaultDates.returnLabel, helper: "10:00 AM", icon: Clock3 }
    ];
  }

  if (kind === "bus") {
    return [
      { label: "From", value: route.from, helper: route.fromCode, icon: MapPinned },
      { label: "To", value: route.to, helper: route.toCode, icon: MapPinned },
      { label: "Travel date", value: defaultDates.departLabel, icon: CalendarDays },
      { label: "Passengers", value: "1 passenger", helper: "Reserved seat", icon: UserRound }
    ];
  }

  return [
    { label: "From", value: route.from, helper: route.fromCode, icon: MapPinned },
    { label: "To", value: route.to, helper: route.toCode, icon: MapPinned },
    { label: "Depart", value: defaultDates.departLabel, icon: CalendarDays },
    {
      label: "Return",
      value: tripType === "One way" ? "Add later" : defaultDates.returnLabel,
      icon: CalendarDays
    }
  ];
}

function SearchPanel({ backendStatus }: { backendStatus: BackendStatus | null }) {
  const [activeKind, setActiveKind] = useState<SearchKind>("flights");
  const [tripType, setTripType] = useState<TripType>("Round trip");
  const [route, setRoute] = useState(defaultRoute);
  const activeTab = searchTabs.find((tab) => tab.id === activeKind) || searchTabs[0];
  const ActiveIcon = activeTab.icon;
  const fields = searchFields(activeKind, route, tripType);
  const showTripType = activeKind === "flights";
  const showSwap = activeKind === "flights" || activeKind === "bus";
  const resultHref = useMemo(
    () => localUrl(buildSearchPath(activeKind, route, tripType)),
    [activeKind, route, tripType]
  );
  const backendLabel = backendStatus?.mode === "cloudflare_bridge" ? "Backend ready" : "Bridge ready";

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

      <div className={`flight-fields ${showSwap ? "" : "no-swap"}`}>
        <Field {...fields[0]} />
        {showSwap ? (
          <button className="swap-btn" type="button" aria-label="Swap route" onClick={swapRoute}>
            <Repeat2 size={19} />
          </button>
        ) : null}
        {fields.slice(1).map((field) => (
          <Field key={`${field.label}-${field.value}`} {...field} />
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
  const latestTrip = trips[0];

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

  const PreviewIcon = latestTrip ? serviceIcon(latestTrip.serviceType) : Plane;

  return (
    <article className="mytrip-card">
      <SectionHeader title="My trips" href="/trips" />
      <div className="trip-preview">
        <img src={tripBeachImage} alt="Beach trip" />
        <span>Upcoming</span>
      </div>
      <div className="trip-details">
        <strong>{latestTrip?.resultTitle || "Phnom Penh → Siem Reap"}</strong>
        <small>
          {latestTrip
            ? `${latestTrip.bookingReference} • ${latestTrip.traveler?.name || latestTrip.status}`
            : "Jun 15 – Jun 18, 2026 • 1 Traveler"}
        </small>
        <div>
          <span>
            <PreviewIcon size={15} />
            {latestTrip ? serviceLabel(latestTrip.serviceType) : "Flight"}
          </span>
          <a href={localUrl(latestTrip?.reviewUrl || "/trips")}>View details</a>
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

function DealsPage({ backendStatus }: { backendStatus: BackendStatus | null }) {
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
                <span className="provider">{deal.save}</span>
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
                  <strong>USD ${deal.price}</strong>
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
  const [trips, setTrips] = useState<SavedTrip[]>(() => readSavedTrips());
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";
  const persistenceLabel =
    backendStatus?.bookingPersistence === "supabase" ? "Supabase sync ready" : "Browser drafts";

  function clearTrips() {
    writeSavedTrips([]);
    setTrips([]);
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
            trips.map((trip) => {
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
                    <strong>
                      {trip.currency} ${trip.total}
                    </strong>
                    <div>
                      <a href={localUrl(trip.reviewUrl)}>
                        Review
                        <ArrowRight size={16} />
                      </a>
                      <a href={trip.checkoutUrl}>
                        Checkout
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
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
              Booking draft
            </span>
            <span>
              <CreditCard size={16} />
              Checkout handoff
            </span>
            <span>
              <WalletCards size={16} />
              Wallet record
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

function ResultsPage({ kind, backendStatus }: { kind: SearchKind; backendStatus: BackendStatus | null }) {
  const [payload, setPayload] = useState<ResultsPayload>(() => fallbackResults(kind));
  const activePayload = payload.product === kind ? payload : fallbackResults(kind);
  const activeTab = searchTabs.find((tab) => tab.id === kind) || searchTabs[0];
  const Icon = activeTab.icon;
  const bridgeLabel = backendStatus?.mode === "cloudflare_bridge" ? "Live bridge" : "Local preview";

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackResults(kind);
    setPayload(fallback);

    if (!canUseTravelApi()) {
      return () => controller.abort();
    }

    const params = new URLSearchParams({
      type: kind,
      from: defaultRoute.from,
      to: defaultRoute.to,
      start: defaultDates.depart,
      end: defaultDates.return,
      travelers: "1"
    });

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
  }, [kind]);

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
          <h1>{activePayload.label}</h1>
          <p>{activePayload.summary}</p>
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

      <div className="results-layout">
        <div className="results-list" aria-label={`${activeTab.label} options`}>
          {activePayload.results.map((result) => (
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
                <strong>
                  {activePayload.currency} ${result.price}
                </strong>
                <a href={result.reviewUrl || result.checkoutUrl}>
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
          <a href={activePayload.results[0]?.reviewUrl || reviewUrl(kind, activePayload.results[0]?.id)}>
            Continue with best option
            <ArrowRight size={18} />
          </a>
        </aside>
      </div>
    </section>
  );
}

function BookingReview({ kind, backendStatus }: { kind: SearchKind; backendStatus: BackendStatus | null }) {
  const searchParams = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const resultId = searchParams?.get("result") || null;
  const dealId = searchParams?.get("deal") || null;
  const [session, setSession] = useState<ReviewSession>(() => fallbackReviewSession(kind, resultId, dealId));
  const activeSession = session.product === kind ? session : fallbackReviewSession(kind, resultId, dealId);
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
  }, [kind, resultId, dealId]);

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

    const params = new URLSearchParams({
      type: kind,
      result: activeSession.result.id,
      from: defaultRoute.from,
      to: defaultRoute.to,
      start: defaultDates.depart,
      end: defaultDates.return,
      travelers: "1"
    });

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
          <a className="back-link" href={localUrl(buildSearchPath(kind))}>
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
            {activeSession.result.tags.map((tag) => (
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
              <strong>
                {activeSession.currency} ${activeSession.subtotal}
              </strong>
            </div>
            <div>
              <span>Service fee</span>
              <strong>
                {activeSession.currency} ${activeSession.serviceFee}
              </strong>
            </div>
            <div>
              <span>Total due</span>
              <strong>
                {activeSession.currency} ${activeSession.total}
              </strong>
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
            {activeSession.ledger.map((item) => (
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
        <a className="checkout-link" href={reviewUrl(activeKind)}>
          Review booking
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

function SectionHeader({ title, href = searchTabs[0].href }: { title: string; href?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <div>
        <a href={localUrl(href)}>View all</a>
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
