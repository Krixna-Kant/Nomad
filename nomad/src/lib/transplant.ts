import { insightsHeatmap, insightsPlaces, type PlaceInsight } from "./qloo";
import type {
  ResolvedEntity,
  TasteDna,
  TransplantResult,
  TwinPlace,
  TwinRole,
  WeekStop,
} from "./types";

const NOISE = new Set(
  [
    "place",
    "visa",
    "mastercard",
    "takeout",
    "wi fi",
    "wifi",
    "nfc mobile payments",
    "restroom",
    "seating",
    "dine in",
    "walk ins",
    "reservations",
    "accepts reservations",
    "credit cards",
    "delivery",
    "parking",
    "valet parking",
    "street view",
    "table service",
    "lunch",
    "dinner",
    "morning",
    "afternoon",
    "impulse visit",
    "foodies",
    "dining drinking",
    "₩10000 to ₩20000",
    "central",
    "urban",
    "commercial corridor",
    "shopping",
    "onsite services",
    "electronics",
    "lifestyle branding",
    "debit cards",
    "credit cards",
    "debit",
    "gift cards",
    "wheelchair accessible parking lot",
    "wheelchair accessible entrance",
    "wheelchair accessible restroom",
    "wheelchair accessible elevator",
    "wheelchair accessible",
    "in store pickup",
    "cash only",
    "electronic",
    "electronics",
    "paid parking lot",
    "free parking lot",
    "parking lot",
  ].map((item) => item.toLowerCase()),
);

const GATHER_HINTS = [
  "bookstore",
  "gallery",
  "live music",
  "venue",
  "club",
  "community",
  "reading",
  "vinyl",
  "jazz",
  "wine bar",
  "market",
  "independent",
  "cinema",
  "theatre",
  "theater",
  "museum",
  "library",
];

const RESTORE_HINTS = [
  "cafe",
  "coffee",
  "restaurant",
  "bakery",
  "tea",
  "brunch",
  "bistro",
  "bar",
];

const THIRD_PLACE = [
  ...RESTORE_HINTS,
  ...GATHER_HINTS,
  "book",
  "record",
  "art",
  "park",
  "diner",
];

const EXCLUDE = [
  "hotel",
  "hostel",
  "motel",
  "apartment",
  "apartments",
  "real estate",
  "furnished",
  "condo",
  "city hall",
  "government",
];

function normalize(tag: string) {
  return tag.trim().toLowerCase();
}

function usableTags(tags: string[]) {
  return tags.filter((tag) => {
    const value = normalize(tag);
    if (value.length < 3 || NOISE.has(value)) return false;
    return !/wheelchair|accessible|elevator|parking|wifi|wi-fi|restroom|pickup|cash only|credit card|debit|gift card|nfc|mastercard|\bvisa\b|delivery|takeout|table service/.test(
      value,
    );
  });
}

export function buildTasteDna(loves: ResolvedEntity[]): TasteDna {
  const counts = new Map<string, { name: string; count: number }>();
  for (const love of loves) {
    for (const tag of usableTags(love.tags)) {
      const key = normalize(tag);
      const current = counts.get(key);
      if (current) current.count += 1;
      else counts.set(key, { name: tag, count: 1 });
    }
  }

  const tags = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      weight: item.count / Math.max(loves.length, 1),
    }));

  const portrait =
    tags.length > 0
      ? tags
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ")
      : "A specific, personal taste, not a tourist default";

  return { portrait, tags };
}

function overlap(a: string[], b: string[]) {
  const other = new Set(b.map(normalize));
  const seen = new Set<string>();
  const shared: string[] = [];
  for (const tag of a) {
    const key = normalize(tag);
    if (other.has(key) && !seen.has(key)) {
      seen.add(key);
      shared.push(tag);
    }
  }
  return shared;
}

function hasHint(text: string, hint: string) {
  const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
}

function haystackOf(place: PlaceInsight) {
  return normalize(
    `${place.name} ${place.tags.join(" ")} ${place.primaryGenre ?? ""} ${place.description}`,
  );
}

function classifyRole(place: PlaceInsight, loves: ResolvedEntity[]): TwinRole {
  const haystack = haystackOf(place);

  if (GATHER_HINTS.some((hint) => hasHint(haystack, hint))) return "gather";
  if (RESTORE_HINTS.some((hint) => hasHint(haystack, hint))) return "restore";

  const bestOverlap = Math.max(
    0,
    ...loves.map((love) => overlap(usableTags(place.tags), love.tags).length),
  );
  if (bestOverlap >= 3 && place.affinity >= 0.55) return "restore";
  return "stretch";
}

function explain(place: PlaceInsight, loves: ResolvedEntity[]) {
  let best = loves[0];
  let shared: string[] = [];
  for (const love of loves) {
    const next = overlap(usableTags(place.tags), love.tags);
    if (next.length > shared.length) {
      best = love;
      shared = next;
    }
  }

  const neighborhood = place.neighborhood
    ? ` in ${place.neighborhood}`
    : "";

  if (best && shared.length >= 2) {
    return {
      closestTo: best.name,
      because: `Closest to ${best.name}: both ${shared.slice(0, 3).join(", ").toLowerCase()}${neighborhood}.`,
    };
  }
  if (best && shared.length === 1) {
    return {
      closestTo: best.name,
      because: `Carries the ${shared[0].toLowerCase()} thread from ${best.name}${neighborhood}.`,
    };
  }
  if (place.description) {
    return {
      closestTo: best?.name ?? "your taste DNA",
      because: place.description,
    };
  }
  return {
    closestTo: best?.name ?? "your taste DNA",
    because: `Fits the same cultural neighborhood as the life you had before${neighborhood}.`,
  };
}

function toTwin(place: PlaceInsight, loves: ResolvedEntity[]): TwinPlace {
  const explained = explain(place, loves);
  return {
    ...place,
    role: classifyRole(place, loves),
    because: explained.because,
    closestTo: explained.closestTo,
  };
}

function neighborhoodsFrom(twins: TwinPlace[]) {
  const counts = new Map<string, number>();
  for (const twin of twins) {
    if (!twin.neighborhood) continue;
    counts.set(twin.neighborhood, (counts.get(twin.neighborhood) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function weekPattern(goals: string[]): TwinRole[] {
  if (goals.includes("people")) {
    return ["gather", "restore", "gather", "restore", "gather", "stretch", "restore"];
  }
  if (goals.includes("new")) {
    return ["stretch", "restore", "stretch", "gather", "stretch", "restore", "gather"];
  }
  return ["restore", "stretch", "gather", "restore", "gather", "stretch", "restore"];
}

function buildWeek(
  twins: TwinPlace[],
  prefs?: { freeDays?: string[]; goals?: string[] },
): WeekStop[] {
  const order = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const wanted = (prefs?.freeDays ?? []).filter((day) => order.includes(day));
  const days = wanted.length > 0 ? order.filter((day) => wanted.includes(day)) : order;
  const buckets: Record<TwinRole, TwinPlace[]> = {
    restore: twins.filter((item) => item.role === "restore"),
    gather: twins.filter((item) => item.role === "gather"),
    stretch: twins.filter((item) => item.role === "stretch"),
  };
  const pattern = weekPattern(prefs?.goals ?? []);
  const used = new Set<string>();
  const week: WeekStop[] = [];

  for (let index = 0; index < days.length; index += 1) {
    const preferred = pattern[index] ?? "restore";
    const fallback: TwinRole[] = [preferred, "restore", "gather", "stretch"];
    const pick = fallback
      .flatMap((role) => buckets[role])
      .find((place) => !used.has(place.id));
    if (!pick) break;
    used.add(pick.id);
    week.push({ day: days[index], place: pick });
  }

  return week;
}

async function placesFor(ids: string[], destination: string) {
  try {
    const batch = await insightsPlaces(ids, destination, 24);
    if (batch.length > 0) return batch;
  } catch {
    // fall through to per-entity queries
  }

  const slices = await Promise.all(
    ids.slice(0, 3).map(async (id) => {
      try {
        return await insightsPlaces([id], destination, 8);
      } catch {
        return [];
      }
    }),
  );

  const unique = new Map<string, PlaceInsight>();
  for (const place of slices.flat()) unique.set(place.id, place);
  return [...unique.values()].sort((a, b) => b.affinity - a.affinity);
}

export async function transplantTaste(
  origin: string,
  destination: string,
  loves: ResolvedEntity[],
  prefs?: { freeDays?: string[]; goals?: string[] },
): Promise<TransplantResult> {
  const ids = loves.map((love) => love.id).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("Add at least one thing you loved from your old city.");
  }

  const [rawPlaces, heatmap] = await Promise.all([
    placesFor(ids, destination),
    insightsHeatmap(ids, destination).catch(() => []),
  ]);

  const twins = rankPlaces(rawPlaces)
    .map((place) => toTwin(place, loves))
    .slice(0, 10);

  return {
    origin,
    destination,
    dna: buildTasteDna(loves),
    twins,
    heatmap: heatmap.slice(0, 80),
    neighborhoods: neighborhoodsFrom(twins),
    week: buildWeek(twins, prefs),
  };
}

function rankPlaces(places: PlaceInsight[]) {
  const unique = new Map<string, PlaceInsight>();
  for (const place of places) {
    if (place.isClosed) continue;
    const key = place.name
      .toLowerCase()
      .replace(/montréal|montreal/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 14);
    const current = unique.get(key);
    if (!current || place.affinity > current.affinity) unique.set(key, place);
  }

  const scored = [...unique.values()]
    .map((place) => ({ place, score: culturalScore(place) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const third = scored.filter((item) =>
    THIRD_PLACE.some((hint) => hasHint(haystackOf(item.place), hint)),
  );
  const other = scored.filter(
    (item) => !THIRD_PLACE.some((hint) => hasHint(haystackOf(item.place), hint)),
  );
  return [...third.slice(0, 7), ...other.slice(0, 3)].map((item) => item.place);
}

function culturalScore(place: PlaceInsight) {
  const haystack = haystackOf(place);
  if (EXCLUDE.some((hint) => hasHint(haystack, hint))) return -1;
  let score = place.affinity;
  if (THIRD_PLACE.some((hint) => hasHint(haystack, hint))) score += 0.28;
  if (place.popularity > 0.98) score -= 0.08;
  return score;
}
