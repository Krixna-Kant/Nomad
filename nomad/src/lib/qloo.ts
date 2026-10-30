import type {
  HeatmapPoint,
  QlooEntity,
  QlooTag,
  ResolvedEntity,
} from "./types";

const QLOO_BASE =
  process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com";

function getApiKey() {
  const key = process.env.QLOO_API_KEY || process.env.API_Key;
  if (!key) {
    throw new Error("Missing QLOO_API_KEY. Add it to .env");
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

async function qlooGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(path, QLOO_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: { "X-Api-Key": getApiKey() },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    throw new Error(`Qloo request failed (${response.status})`);
  }

  return body as T;
}

export function entityKind(types: string[]) {
  const joined = types.join(" ");
  if (joined.includes("place")) return "place";
  if (joined.includes("artist")) return "artist";
  if (joined.includes("book")) return "book";
  if (joined.includes("movie")) return "film";
  if (joined.includes("tv_show")) return "tv";
  if (joined.includes("brand")) return "brand";
  if (joined.includes("podcast")) return "podcast";
  if (joined.includes("person")) return "person";
  if (joined.includes("album")) return "album";
  return "entity";
}

function geocodeCity(entity: QlooEntity) {
  const properties = asRecord(entity.properties);
  const geocode = asRecord(properties?.geocode);
  return (
    asString(geocode?.city) ||
    asString(geocode?.name) ||
    asString(properties?.neighborhood) ||
    null
  );
}

function imageUrl(entity: QlooEntity) {
  const properties = asRecord(entity.properties);
  const image = asRecord(properties?.image);
  return asString(image?.url);
}

export function toResolvedEntity(entity: QlooEntity): ResolvedEntity {
  const types = entity.types ?? (entity.subtype ? [entity.subtype] : []);
  return {
    id: entity.entity_id,
    name: entity.name,
    types,
    kind: entityKind(types),
    disambiguation: entity.disambiguation ?? "",
    popularity: entity.popularity ?? 0,
    imageUrl: imageUrl(entity),
    tags: (entity.tags ?? [])
      .map((tag: QlooTag) => tag.name)
      .filter(Boolean)
      .slice(0, 14),
    city: geocodeCity(entity),
  };
}

type SearchResponse = { results?: QlooEntity[] };

export async function searchEntities(query: string, types?: string) {
  const data = await qlooGet<SearchResponse>("/search", {
    query,
    types,
    take: 8,
  });
  const ranked = (data.results ?? []).map(toResolvedEntity);
  const order = ["place", "artist", "book", "film", "brand", "tv", "podcast"];
  return ranked.sort((a, b) => {
    const da = order.indexOf(a.kind);
    const db = order.indexOf(b.kind);
    return (da === -1 ? 9 : da) - (db === -1 ? 9 : db);
  });
}

type InsightsResponse = {
  success?: boolean;
  results?: {
    entities?: QlooEntity[];
    heatmap?: Array<{
      location?: { latitude?: number; longitude?: number };
      query?: { affinity?: number; popularity?: number };
    }>;
  };
};

function primaryGenre(properties: Record<string, unknown> | null) {
  const raw = properties?.primary_genre;
  if (typeof raw === "string") return raw;
  const rec = asRecord(raw);
  return asString(rec?.name) || asString(rec?.value);
}

export type PlaceInsight = ResolvedEntity & {
  affinity: number;
  address: string;
  description: string;
  website: string | null;
  rating: number | null;
  priceLevel: number | null;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  primaryGenre: string | null;
  isClosed: boolean;
};

export async function insightsPlaces(
  entityIds: string[],
  location: string,
  take = 16,
): Promise<PlaceInsight[]> {
  const data = await qlooGet<InsightsResponse>("/v2/insights", {
    "filter.type": "urn:entity:place",
    "signal.interests.entities": entityIds.join(","),
    "filter.location.query": location,
    take,
  });

  return (data.results?.entities ?? []).map((entity) => {
    const properties = asRecord(entity.properties);
    const geocode = asRecord(properties?.geocode);
    return {
      ...toResolvedEntity(entity),
      affinity: entity.query?.affinity ?? 0,
      address: asString(properties?.address) ?? "",
      description:
        asString(properties?.short_description) ||
        asString(properties?.description) ||
        asString(properties?.overall_description) ||
        "",
      website: asString(properties?.website),
      rating: asNumber(properties?.business_rating),
      priceLevel: asNumber(properties?.price_level),
      lat: entity.location?.lat ?? null,
      lng: entity.location?.lon ?? null,
      neighborhood: (() => {
        const named = asString(properties?.neighborhood);
        const geoName = asString(geocode?.name);
        const city = asString(geocode?.city);
        if (named) return named;
        if (geoName && geoName !== city) return geoName;
        return asString(properties?.locality);
      })(),
      primaryGenre: primaryGenre(properties),
      isClosed: Boolean(properties?.is_closed),
    };
  });
}

export async function insightsHeatmap(
  entityIds: string[],
  location: string,
): Promise<HeatmapPoint[]> {
  const data = await qlooGet<InsightsResponse>("/v2/insights", {
    "filter.type": "urn:heatmap",
    "signal.interests.entities": entityIds.join(","),
    "filter.location.query": location,
  });

  return (data.results?.heatmap ?? [])
    .map((point) => ({
      lat: point.location?.latitude ?? 0,
      lng: point.location?.longitude ?? 0,
      affinity: point.query?.affinity ?? 0,
      popularity: point.query?.popularity ?? 0,
    }))
    .filter((point) => point.lat !== 0 || point.lng !== 0)
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 80);
}

export async function pingQloo() {
  const started = Date.now();
  const results = await searchEntities("Radiohead", "urn:entity:artist");
  return {
    ok: results.length > 0,
    latencyMs: Date.now() - started,
    sample: results[0]?.name ?? null,
  };
}
