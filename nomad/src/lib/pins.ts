import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { PublicPin, ResolvedEntity, TransplantResult, TwinRole } from "./types";

const FILE = path.join(process.cwd(), "data", "pins.json");
const MAX_PINS = 48;
const ROLES: TwinRole[] = ["restore", "stretch", "gather"];

const SEED: PublicPin[] = [
  {
    id: "seed-seoul-montreal",
    createdAt: "2026-10-31T00:00:00.000Z",
    origin: "Seoul",
    destination: "Montreal",
    portrait: "Book store, relaxing, fashion forward",
    tags: ["Book store", "Relaxing", "Fashion forward", "Welcoming"],
    loves: [
      { name: "Café Kitsuné Seoul", kind: "place" },
      { name: "Kyobo Book Centre", kind: "place" },
      { name: "Radiohead", kind: "artist" },
      { name: "Parasite", kind: "film" },
    ],
    neighborhoods: ["Le Plateau-Mont-Royal", "Ville-Marie", "Notre-Dame-de-Grâce"],
    twins: [
      {
        name: "Restaurant Bok",
        role: "restore",
        neighborhood: "Notre-Dame-de-Grâce",
        because:
          "A Korean table in Sherbrooke West, a landing spot if Seoul food was part of home.",
      },
      {
        name: "Les Alchimistes Café",
        role: "restore",
        neighborhood: "Le Plateau-Mont-Royal",
        because: "Late-night coffee and small plates on St. Laurent.",
      },
      {
        name: "Café Nocturne",
        role: "restore",
        neighborhood: "Le Plateau-Mont-Royal",
        because: "A recurring cafe, not a one-visit tourist stop.",
      },
    ],
    week: [
      { day: "Monday", name: "Restaurant Bok", role: "restore", neighborhood: "Notre-Dame-de-Grâce" },
      { day: "Wednesday", name: "Négasaké", role: "restore", neighborhood: "Le Plateau-Mont-Royal" },
      { day: "Sunday", name: "Café Nocturne", role: "restore", neighborhood: "Le Plateau-Mont-Royal" },
    ],
  },
];

declare global {
  var nomadPins: PublicPin[] | undefined;
}

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function asRole(value: unknown): TwinRole {
  return ROLES.includes(value as TwinRole) ? (value as TwinRole) : "stretch";
}

export function toPublicPin(
  result: TransplantResult,
  loves: ResolvedEntity[],
): Omit<PublicPin, "id" | "createdAt"> {
  return {
    origin: clip(result.origin, 60),
    destination: clip(result.destination, 60),
    portrait: clip(result.dna.portrait, 160),
    tags: result.dna.tags.map((tag) => clip(tag.name, 40)).filter(Boolean).slice(0, 8),
    loves: loves
      .map((love) => ({
        name: clip(love.name, 80),
        kind: clip(love.kind, 24) || "entity",
      }))
      .filter((love) => love.name)
      .slice(0, 6),
    neighborhoods: result.neighborhoods
      .map((item) => clip(item.name, 60))
      .filter(Boolean)
      .slice(0, 5),
    twins: result.twins.slice(0, 8).map((twin) => ({
      name: clip(twin.name, 80),
      role: asRole(twin.role),
      neighborhood: clip(twin.neighborhood, 60) || null,
      because: clip(twin.because, 220),
    })),
    week: result.week.slice(0, 7).map((stop) => ({
      day: clip(stop.day, 16),
      name: clip(stop.place.name, 80),
      role: asRole(stop.place.role),
      neighborhood: clip(stop.place.neighborhood, 60) || null,
    })),
  };
}

async function readStored() {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as PublicPin[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStored(pins: PublicPin[]) {
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(pins, null, 2));
  } catch {
    // Serverless hosts cannot persist files; memory still holds this instance.
  }
}

function merge(stored: PublicPin[]) {
  const byId = new Map<string, PublicPin>();
  for (const pin of [...SEED, ...stored]) byId.set(pin.id, pin);
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPins() {
  if (!globalThis.nomadPins) {
    globalThis.nomadPins = await readStored();
  }
  return merge(globalThis.nomadPins);
}

export async function addPin(draft: Omit<PublicPin, "id" | "createdAt">) {
  if (!globalThis.nomadPins) {
    globalThis.nomadPins = await readStored();
  }

  const duplicate = globalThis.nomadPins.find(
    (pin) =>
      pin.origin.toLowerCase() === draft.origin.toLowerCase() &&
      pin.destination.toLowerCase() === draft.destination.toLowerCase() &&
      pin.portrait === draft.portrait,
  );
  if (duplicate) return duplicate;

  const pin: PublicPin = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  globalThis.nomadPins = [pin, ...globalThis.nomadPins].slice(0, MAX_PINS);
  await writeStored(globalThis.nomadPins);
  return pin;
}
