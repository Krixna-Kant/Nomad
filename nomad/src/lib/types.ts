export type QlooTag = {
  name: string;
  tag_id?: string;
  type?: string;
  value?: string;
};

export type QlooEntity = {
  name: string;
  entity_id: string;
  types?: string[];
  type?: string;
  subtype?: string;
  disambiguation?: string;
  popularity?: number;
  tags?: QlooTag[];
  location?: {
    lat?: number;
    lon?: number;
    geohash?: string;
  };
  properties?: Record<string, unknown>;
  query?: {
    affinity?: number;
    distance?: number;
  };
};

export type ResolvedEntity = {
  id: string;
  name: string;
  types: string[];
  kind: string;
  disambiguation: string;
  popularity: number;
  imageUrl: string | null;
  tags: string[];
  city: string | null;
};

export type HeatmapPoint = {
  lat: number;
  lng: number;
  affinity: number;
  popularity: number;
};

export type TwinRole = "restore" | "stretch" | "gather";

export type TwinPlace = ResolvedEntity & {
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
  because: string;
  closestTo: string;
  role: TwinRole;
};

export type TasteDna = {
  portrait: string;
  tags: { name: string; weight: number }[];
};

export type WeekStop = {
  day: string;
  place: TwinPlace;
};

export type TransplantResult = {
  origin: string;
  destination: string;
  dna: TasteDna;
  twins: TwinPlace[];
  heatmap: HeatmapPoint[];
  neighborhoods: { name: string; count: number }[];
  week: WeekStop[];
};
