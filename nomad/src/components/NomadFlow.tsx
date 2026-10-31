"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TasteHeatmap } from "@/components/TasteHeatmap";
import type { ResolvedEntity, TransplantResult, TwinRole } from "@/lib/types";

type Step = "move" | "places" | "life" | "time" | "dna" | "results";
type ReasonId = "job" | "study" | "remote" | "personal";

const STEPS: { id: Exclude<Step, "results">; label: string }[] = [
  { id: "move", label: "Move" },
  { id: "places", label: "Places" },
  { id: "life", label: "Life" },
  { id: "time", label: "Time" },
  { id: "dna", label: "Profile" },
];

const REASONS: { id: ReasonId; label: string }[] = [
  { id: "job", label: "New job" },
  { id: "study", label: "Education" },
  { id: "remote", label: "Remote work" },
  { id: "personal", label: "Personal relocation" },
];

const LIFESTYLES = [
  { id: "cafes", label: "Quiet cafes", hint: "Work and relax" },
  { id: "music", label: "Live music", hint: "Discover artists" },
  { id: "social", label: "Social communities", hint: "Meet people" },
  { id: "fitness", label: "Fitness", hint: "Sports and activities" },
  { id: "art", label: "Art and culture", hint: "Creative spaces" },
  { id: "books", label: "Books and learning", hint: "Explore interests" },
];

const GOALS = [
  { id: "familiar", label: "Discover familiar experiences" },
  { id: "people", label: "Meet like-minded people" },
  { id: "new", label: "Explore completely new things" },
  { id: "routine", label: "Build a consistent weekly routine" },
];

const TRAVEL = [
  { id: "15", label: "15 minutes" },
  { id: "30", label: "30 minutes" },
  { id: "45", label: "45 minutes" },
];

const BUDGETS = [
  { id: "light", label: "Keep it light" },
  { id: "moderate", label: "A normal week" },
  { id: "open", label: "No budget cap" },
];

const TRANSIT = [
  { id: "walk", label: "Walk" },
  { id: "transit", label: "Transit" },
  { id: "bike", label: "Bike" },
  { id: "car", label: "Car" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const SLOTS = ["Morning", "Afternoon", "Evening", "Night"] as const;

const DEMO_SEEDS = [
  { q: "Café Kitsuné Seoul", types: "urn:entity:place" },
  { q: "What the Book Seoul", types: "urn:entity:place" },
  { q: "Radiohead", types: "urn:entity:artist" },
  { q: "Parasite", types: "urn:entity:movie" },
];

const ROLE_COPY: Record<TwinRole, string> = {
  restore: "Restore",
  stretch: "Stretch",
  gather: "Gather",
};

const LOADING_LINES = [
  "Sending the matched places to Qloo…",
  "Reading cultural neighbors, not another cafe of the same kind…",
  "Looking for that taste in the new city…",
  "Fitting a week to the days you are free…",
];

const TAG_NOISE = /payment|parking|wifi|wi-fi|takeout|pickup|wheelchair|nfc|cash|delivery|restroom|credit|debit|elevator|reserv|dine in|walk in|electronic|visa|mastercard/;

function placeFromLink(value: string) {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    const place = url.pathname.match(/\/place\/([^/]+)/);
    if (place) {
      return decodeURIComponent(place[1]).replace(/\+/g, " ").replace(/-/g, " ");
    }
    return url.searchParams.get("q") || url.searchParams.get("query");
  } catch {
    return null;
  }
}

function reasonFrom(text: string): ReasonId | "" {
  const value = text.toLowerCase();
  if (/remote/.test(value)) return "remote";
  if (/stud|universit|school|education|college/.test(value)) return "study";
  if (/personal|family|partner/.test(value)) return "personal";
  if (/job|work|career|office/.test(value)) return "job";
  return "";
}

function readSentence(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const move = cleaned.match(
    /from\s+(.+?)\s+to\s+(.+?)(?:\s+for\s+([^.]{1,80}))?(?:[.]|$)/i,
  );
  if (!move) return null;
  const origin = move[1].replace(/[,.]$/, "").trim();
  const destination = move[2].replace(/[,.]$/, "").trim();
  if (origin.length < 2 || destination.length < 2) return null;

  const lower = cleaned.toLowerCase();
  const lifestyles = LIFESTYLES.filter((item) => {
    if (item.id === "cafes") return /caf[eé]|coffee|quiet/.test(lower);
    if (item.id === "music") return /music|indie|gig|venue|concert/.test(lower);
    if (item.id === "social") return /people|community|friends|social/.test(lower);
    if (item.id === "fitness") return /run|gym|fitness|sport/.test(lower);
    if (item.id === "art") return /art|creative|gallery|museum/.test(lower);
    return /book|read|library/.test(lower);
  }).map((item) => item.id);

  const goals = GOALS.filter((item) => {
    if (item.id === "people") return /meet|people|community/.test(lower);
    if (item.id === "new") return /new things|explore/.test(lower);
    if (item.id === "routine") return /routine|weekly/.test(lower);
    return /familiar|like home|at home/.test(lower);
  }).map((item) => item.id);

  const free: string[] = [];
  if (/evening/.test(lower)) {
    for (const day of DAYS.slice(0, 5)) free.push(`${day}-Evening`);
  }
  if (/weekend/.test(lower)) {
    for (const day of DAYS.slice(5)) free.push(`${day}-Afternoon`, `${day}-Evening`);
  }

  return {
    origin,
    destination,
    reason: reasonFrom(move[3] ? `${move[3]} ${cleaned}` : cleaned),
    lifestyles,
    goals,
    free,
  };
}

function isResolved(love: ResolvedEntity) {
  return Boolean(love.id) && !love.id.startsWith("note:");
}

function interestNames(loves: ResolvedEntity[], lifestyles: string[]) {
  const counts = new Map<string, number>();
  for (const love of loves) {
    for (const tag of love.tags) {
      const name = tag.trim();
      if (name.length < 3 || TAG_NOISE.test(name.toLowerCase())) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const fromTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
  const fromLife = LIFESTYLES.filter((item) => lifestyles.includes(item.id)).map(
    (item) => item.label,
  );
  return [...new Set([...fromTags, ...fromLife])].slice(0, 6);
}

function go(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={shown ? `reveal is-in ${className}` : `reveal ${className}`}>
      {children}
    </div>
  );
}

function downloadItinerary(result: TransplantResult, loves: ResolvedEntity[]) {
  const lines = [
    `Nomad itinerary`,
    `${result.origin} to ${result.destination}`,
    "",
    "Lifestyle DNA",
    result.dna.portrait,
    result.dna.tags.map((tag) => tag.name).join(", "),
    loves.length > 0 ? `Built from ${loves.map((love) => love.name).join(", ")}` : "",
    "",
    "First week",
    ...result.week.map(
      (stop) =>
        `${stop.day}: ${stop.place.name}${stop.place.neighborhood ? `, ${stop.place.neighborhood}` : ""} (${ROLE_COPY[stop.place.role]})`,
    ),
    "",
    "Places",
    ...result.twins.map(
      (twin) =>
        `${twin.name}${twin.neighborhood ? `, ${twin.neighborhood}` : ""}${twin.because ? `. ${twin.because}` : ""}`,
    ),
    "",
  ].filter((line) => line !== undefined);

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Nomad-${result.origin}-to-${result.destination}.txt`.replace(/\s+/g, "-");
  link.click();
  URL.revokeObjectURL(url);
}

function PlacePhoto({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className="twin-fallback" aria-hidden="true">
        {alt.slice(0, 1)}
      </div>
    );
  }
  return (
    <img src={src} alt={alt} width={640} height={420} onError={() => setOk(false)} />
  );
}

function ChoiceGrid({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: string; label: string; hint?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="choice-grid" role="group" aria-label={label}>
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            className={on ? "choice is-on" : "choice"}
            aria-pressed={on}
            onClick={() => onToggle(option.id)}
          >
            <strong>{option.label}</strong>
            {option.hint ? <span>{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function NomadFlow() {
  const [step, setStep] = useState<Step>("move");
  const [sentence, setSentence] = useState("");
  const [caught, setCaught] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState<ReasonId | "">("");
  const [loves, setLoves] = useState<ResolvedEntity[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ResolvedEntity[]>([]);
  const [searching, setSearching] = useState(false);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [free, setFree] = useState<string[]>([]);
  const [travel, setTravel] = useState("");
  const [budget, setBudget] = useState("");
  const [transit, setTransit] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadLine, setLoadLine] = useState(LOADING_LINES[0]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransplantResult | null>(null);

  const selectedIds = useMemo(() => new Set(loves.map((item) => item.id)), [loves]);
  const resolved = loves.filter(isResolved);
  const moveOk = origin.trim().length > 1 && destination.trim().length > 1;
  const placesOk = resolved.length >= 2;
  const lifeOk = lifestyles.length > 0 && goals.length > 0;
  const timeOk = free.length > 0;

  const interests = interestNames(resolved, lifestyles);
  const reasonLabel = REASONS.find((item) => item.id === reason)?.label;
  const travelLabel = TRAVEL.find((item) => item.id === travel)?.label;
  const budgetLabel = BUDGETS.find((item) => item.id === budget)?.label;
  const transitLabel = TRANSIT.find((item) => item.id === transit)?.label;
  const freeDays = [...new Set(free.map((key) => key.split("-")[0]))];

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setHits([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const hinted =
        origin && !value.toLowerCase().includes(origin.toLowerCase())
          ? `${value} ${origin}`
          : value;
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(hinted)}`);
        const body = (await response.json()) as { results?: ResolvedEntity[] };
        setHits((body.results ?? []).filter((item) => !selectedIds.has(item.id)));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, origin, selectedIds]);

  useEffect(() => {
    if (!loading) return;
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % LOADING_LINES.length;
      setLoadLine(LOADING_LINES[index]);
    }, 1600);
    return () => clearInterval(timer);
  }, [loading]);

  function openStep(next: Step) {
    setError(null);
    setStep(next);
    go("try");
  }

  function toggle(list: string[], id: string, setList: (value: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  function pickOne(current: string, id: string, setValue: (value: string) => void) {
    setValue(current === id ? "" : id);
  }

  function toggleSlot(day: string, slot: string) {
    const key = `${day}-${slot}`;
    setFree((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function addLove(entity: ResolvedEntity) {
    if (loves.length >= 5) return;
    setLoves((current) =>
      current.some((item) => item.id === entity.id) ? current : [...current, entity],
    );
    setQuery("");
    setHits([]);
  }

  function addNote() {
    const name = query.trim();
    if (name.length < 2 || loves.length >= 5) return;
    const entity: ResolvedEntity = {
      id: `note:${crypto.randomUUID()}`,
      name,
      types: [],
      kind: "note",
      disambiguation: "Kept as your words",
      popularity: 0,
      imageUrl: null,
      tags: [],
      city: origin.trim() || null,
    };
    setLoves((current) => [...current, entity]);
    setQuery("");
    setHits([]);
  }

  function removeLove(id: string) {
    setLoves((current) => current.filter((item) => item.id !== id));
    setNotes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function applySentence() {
    const read = readSentence(sentence);
    if (!read) {
      setCaught(null);
      setError("Include both cities, as in: from Delhi to Berlin.");
      return;
    }
    setOrigin(read.origin);
    setDestination(read.destination);
    if (read.reason) setReason(read.reason);
    if (read.lifestyles.length > 0) setLifestyles(read.lifestyles);
    if (read.goals.length > 0) setGoals(read.goals);
    if (read.free.length > 0) setFree(read.free);
    const bits = [`${read.origin} to ${read.destination}`];
    if (read.reason) {
      const label = REASONS.find((item) => item.id === read.reason)?.label;
      if (label) bits.push(label.toLowerCase());
    }
    setCaught(`Read ${bits.join(", ")}. Correct anything below, then add the places that felt like home.`);
    setError(null);
  }

  async function loadDemo() {
    setLoadingDemo(true);
    setError(null);
    try {
      const found: ResolvedEntity[] = [];
      for (const seed of DEMO_SEEDS) {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(seed.q)}&types=${encodeURIComponent(seed.types)}`,
        );
        const body = (await response.json()) as { results?: ResolvedEntity[] };
        const match = body.results?.[0];
        if (match && !found.some((item) => item.id === match.id)) found.push(match);
      }
      if (found.length < 2) throw new Error("Could not load the demo taste profile.");
      setOrigin("Seoul");
      setDestination("Montreal");
      setReason("remote");
      setLoves(found);
      setNotes({
        [found[0].id]: "A familiar room, not a tourist stop.",
      });
      setLifestyles(["cafes", "books", "music"]);
      setGoals(["familiar", "routine"]);
      setFree([
        "Monday-Evening",
        "Wednesday-Evening",
        "Friday-Night",
        "Saturday-Afternoon",
        "Sunday-Morning",
      ]);
      setTravel("30");
      setBudget("moderate");
      setCaught(null);
      setQuery("");
      setHits([]);
      openStep("dna");
    } catch {
      setError("Could not load the demo taste profile.");
    } finally {
      setLoadingDemo(false);
    }
  }

  async function runTransplant() {
    if (!moveOk || !placesOk) return;
    setLoading(true);
    setError(null);
    setLoadLine(LOADING_LINES[0]);
    try {
      const response = await fetch("/api/transplant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.trim(),
          destination: destination.trim(),
          loves: resolved,
          freeDays,
          goals,
        }),
      });
      const body = (await response.json()) as TransplantResult & { error?: string };
      if (!response.ok) throw new Error(body.error || "Transplant failed");
      setResult(body);
      openStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transplant failed");
    } finally {
      setLoading(false);
    }
  }

  function canOpen(target: Exclude<Step, "results">) {
    const index = STEPS.findIndex((item) => item.id === target);
    if (index > 0 && !moveOk) return false;
    if (index > 1 && !placesOk) return false;
    if (index > 2 && !lifeOk) return false;
    if (index > 3 && !timeOk) return false;
    return true;
  }

  return (
    <div>
      <ol className="steps" aria-label="Onboarding">
        {STEPS.map((item) => {
          const index = STEPS.findIndex((entry) => entry.id === item.id);
          const currentIndex = step === "results" ? STEPS.length : STEPS.findIndex((entry) => entry.id === step);
          const state = step === item.id ? "current" : index < currentIndex ? "done" : "";
          return (
            <li key={item.id} className={state}>
              <button
                type="button"
                aria-current={step === item.id ? "step" : undefined}
                disabled={!canOpen(item.id)}
                onClick={() => openStep(item.id)}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === "move" ? (
        <section className="panel">
          <h2 className="ask">Where are you moving?</h2>
          <p className="ask-help">
            Origin and destination are the whole point. The reason can wait.
          </p>

          <div className="sentence">
            <label className="field">
              <span>Or say it in one go</span>
              <textarea
                value={sentence}
                onChange={(event) => setSentence(event.target.value)}
                placeholder="I'm moving from Delhi to Berlin for work. I love quiet cafes and indie music. Evenings are free."
              />
            </label>
            <button type="button" className="ghost" onClick={applySentence}>
              Read that
            </button>
            {caught ? <p className="status">{caught}</p> : null}
          </div>

          <div className="city-pair">
            <label className="field">
              <span>Your current city</span>
              <input
                name="origin"
                autoComplete="address-level2"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="Delhi, India"
              />
            </label>
            <label className="field">
              <span>Your destination city</span>
              <input
                name="destination"
                autoComplete="address-level2"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Berlin, Germany"
              />
            </label>
          </div>

          <p className="field-label">What is bringing you there?</p>
          <ChoiceGrid
            label="Reason for moving"
            options={REASONS}
            selected={reason ? [reason] : []}
            onToggle={(id) => pickOne(reason, id, (value) => setReason(value as ReasonId | ""))}
          />

          {error ? <p className="status status-bad">{error}</p> : null}
          <div className="actions">
            <button type="button" className="btn" onClick={() => openStep("places")} disabled={!moveOk}>
              Continue
            </button>
            <button
              type="button"
              className="ghost demo"
              onClick={loadDemo}
              disabled={loadingDemo}
              aria-busy={loadingDemo}
            >
              <span>{loadingDemo ? "Loading Maya…" : "Try Maya"}</span>
              <span className="demo-sub">Seoul to Montreal</span>
            </button>
          </div>
        </section>
      ) : null}

      {step === "places" ? (
        <section className="panel">
          <h2 className="ask">Which places made that city feel like home?</h2>
          <p className="ask-help">
            Add three to five. They do not have to match. A cafe and a venue can both be you. Two
            matched places are enough for Qloo to start.
          </p>

          <label className="field">
            <span>
              Search a place, {loves.length}/5
            </span>
            <input
              name="love-query"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(placeFromLink(next) ?? next);
              }}
              placeholder="A cafe, venue, bookstore, or a Maps link"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (hits[0]) addLove(hits[0]);
                }
              }}
            />
          </label>
          {searching ? (
            <p className="status" role="status">
              Searching Qloo…
            </p>
          ) : query.trim().length >= 2 && hits.length === 0 ? (
            <p className="field-help">No Qloo match. You can keep it as a note.</p>
          ) : (
            <p className="field-help">A name works. So does a Google Maps link.</p>
          )}
          {hits.length > 0 ? (
            <ul className="suggest">
              {hits.slice(0, 6).map((hit) => (
                <li key={`${hit.id}-${hit.kind}`}>
                  <button type="button" onClick={() => addLove(hit)}>
                    <strong>{hit.name}</strong>
                    <span>
                      {hit.kind}
                      {hit.city ? `, ${hit.city}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {query.trim().length >= 2 && !searching && hits.length === 0 ? (
            <button type="button" className="ghost add-note" onClick={addNote}>
              Keep this as a note
            </button>
          ) : null}

          {loves.length > 0 ? (
            <ul className="love-list">
              {loves.map((love) => (
                <li key={love.id}>
                  <div className="love-top">
                    <div>
                      <strong>{love.name}</strong>
                      <p>
                        {isResolved(love)
                          ? `${love.kind}${love.city ? `, ${love.city}` : ""}`
                          : "Your note. Qloo will not read this one."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeLove(love.id)}
                      aria-label={`Remove ${love.name}`}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    className="note-input"
                    value={notes[love.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [love.id]: event.target.value }))
                    }
                    placeholder="What do you love about it? Optional."
                    aria-label={`What you love about ${love.name}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {error ? <p className="status status-bad">{error}</p> : null}
          <div className="actions">
            <button type="button" className="btn" onClick={() => openStep("life")} disabled={!placesOk}>
              Continue
            </button>
            <button type="button" className="ghost" onClick={() => openStep("move")}>
              Back
            </button>
          </div>
          {!placesOk ? (
            <p className="field-help">Match at least two places on Qloo to continue.</p>
          ) : null}
        </section>
      ) : null}

      {step === "life" ? (
        <section className="panel">
          <h2 className="ask">What should the new week hold?</h2>
          <p className="ask-help">
            This is separate from the places. One is what you already love. This is what you want
            the new city to give you.
          </p>
          <p className="field-label">Your ideal week</p>
          <ChoiceGrid
            label="Lifestyle"
            options={LIFESTYLES}
            selected={lifestyles}
            onToggle={(id) => toggle(lifestyles, id, setLifestyles)}
          />
          <p className="field-label">What you hope to get</p>
          <ChoiceGrid
            label="Goals"
            options={GOALS}
            selected={goals}
            onToggle={(id) => toggle(goals, id, setGoals)}
          />
          <div className="actions">
            <button type="button" className="btn" onClick={() => openStep("time")} disabled={!lifeOk}>
              Continue
            </button>
            <button type="button" className="ghost" onClick={() => openStep("places")}>
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === "time" ? (
        <section className="panel">
          <h2 className="ask">When are you actually free?</h2>
          <p className="ask-help">
            The week after this only lands on days you mark. Travel time and budget stay on the
            profile. They do not invent places.
          </p>
          <ul className="day-list">
            {DAYS.map((day) => (
              <li key={day} className="day-row">
                <span>{day}</span>
                <div className="slots">
                  {SLOTS.map((slot) => {
                    const key = `${day}-${slot}`;
                    const on = free.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={on ? "slot is-on" : "slot"}
                        aria-pressed={on}
                        onClick={() => toggleSlot(day, slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          <p className="field-label">How far will you go?</p>
          <ChoiceGrid
            label="Travel time"
            options={TRAVEL}
            selected={travel ? [travel] : []}
            onToggle={(id) => pickOne(travel, id, setTravel)}
          />
          <p className="field-label">Weekly spend</p>
          <ChoiceGrid
            label="Budget"
            options={BUDGETS}
            selected={budget ? [budget] : []}
            onToggle={(id) => pickOne(budget, id, setBudget)}
          />
          <p className="field-label">How you get around</p>
          <ChoiceGrid
            label="Transport"
            options={TRANSIT}
            selected={transit ? [transit] : []}
            onToggle={(id) => pickOne(transit, id, setTransit)}
          />
          <div className="actions">
            <button type="button" className="btn" onClick={() => openStep("dna")} disabled={!timeOk}>
              See the profile
            </button>
            <button type="button" className="ghost" onClick={() => openStep("life")}>
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === "dna" ? (
        <section className="panel">
          <h2 className="ask">Does this sound like you?</h2>
          <p className="ask-help">
            Qloo has not searched {destination.trim() || "the new city"} yet. This is only the
            reading of what you gave. Correct it before the map.
          </p>
          <div className="profile">
            <p className="profile-route">
              <strong>
                {origin.trim()} to {destination.trim()}
              </strong>
              {reasonLabel ? <span>{reasonLabel}</span> : null}
            </p>
            {interests.length > 0 ? (
              <>
                <p className="field-label">Strongest signals</p>
                <ul className="dna">
                  {interests.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="field-label">Places</p>
            <ul className="profile-places">
              {loves.map((love) => (
                <li key={love.id}>
                  <strong>{love.name}</strong>
                  {notes[love.id] ? <span>{notes[love.id]}</span> : null}
                </li>
              ))}
            </ul>
            <p className="field-label">The week you asked for</p>
            <p className="profile-meta">
              {freeDays.join(", ")}
              {travelLabel ? `. Within ${travelLabel}` : ""}
              {budgetLabel ? `. ${budgetLabel}` : ""}
              {transitLabel ? `. ${transitLabel}` : ""}
              {goals.includes("people") ? ". The week will lean toward meeting people." : ""}
              {goals.includes("new") && !goals.includes("people")
                ? ". The week will leave room for something new."
                : ""}
            </p>
          </div>
          {loading ? (
            <p className="status" role="status">
              {loadLine}
            </p>
          ) : null}
          {error ? <p className="status status-bad">{error}</p> : null}
          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={runTransplant}
              disabled={loading || !placesOk}
              aria-busy={loading}
            >
              {loading ? "Building the week…" : "Looks right"}
            </button>
            <button type="button" className="ghost" onClick={() => openStep("places")} disabled={loading}>
              Edit places
            </button>
            <button type="button" className="ghost" onClick={() => openStep("life")} disabled={loading}>
              Edit the week
            </button>
          </div>
        </section>
      ) : null}

      {step === "results" && result ? (
        <ResultsView
          result={result}
          loves={resolved}
          onRestart={() => {
            setStep("move");
            setResult(null);
            setError(null);
            go("try");
          }}
          onChangeCity={() => {
            setStep("move");
            setResult(null);
            go("try");
          }}
        />
      ) : null}
    </div>
  );
}

function ResultsView({
  result,
  loves,
  onRestart,
  onChangeCity,
}: {
  result: TransplantResult;
  loves: ResolvedEntity[];
  onRestart: () => void;
  onChangeCity: () => void;
}) {
  const [pinState, setPinState] = useState<"idle" | "saving" | "pinned" | "error">("idle");

  async function pinAnonymously() {
    if (pinState === "saving" || pinState === "pinned") return;
    setPinState("saving");
    try {
      const response = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, loves }),
      });
      if (!response.ok) throw new Error("Could not pin");
      setPinState("pinned");
      window.dispatchEvent(new Event("nomad:pinned"));
    } catch {
      setPinState("error");
    }
  }

  const photos = result.twins.filter((twin) => twin.imageUrl).slice(0, 3);
  const tasteTags = result.dna.tags.slice(0, 5);

  return (
    <div className="results">
      <Reveal>
        <section className="dna-card" id="dna-built">
          <h2>
            {result.origin} to {result.destination}
          </h2>
          <p className="ask-help">
            Lifestyle DNA, built from {loves.map((love) => love.name).join(", ") || "the places you named"}.
          </p>
          {tasteTags.length > 0 ? (
            <ul className="dna dna-build">
              {tasteTags.map((tag) => (
                <li key={tag.name}>{tag.name}</li>
              ))}
            </ul>
          ) : (
            <p className="profile-meta">{result.dna.portrait}</p>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="city-stage" id="city-map">
          {photos.length > 0 ? (
            <ul className="city-film">
              {photos.map((twin) => (
                <li key={twin.id}>
                  <PlacePhoto src={twin.imageUrl ?? ""} alt={twin.name} />
                </li>
              ))}
            </ul>
          ) : null}
          <TasteHeatmap
            points={result.heatmap}
            destination={result.destination}
            twins={result.twins}
            neighborhoods={result.neighborhoods}
          />
        </section>
      </Reveal>

      <Reveal>
      <section id="places">
        <h3 className="section-title">Places in {result.destination}</h3>
        {result.twins.length === 0 ? (
          <p className="lead">No reliable matches in {result.destination}. Try another city.</p>
        ) : (
          <ul className="twin-grid">
            {result.twins.map((twin) => (
              <li key={twin.id} className="twin-card">
                {twin.imageUrl ? (
                  <PlacePhoto src={twin.imageUrl} alt={twin.name} />
                ) : (
                  <div className="twin-fallback" aria-hidden="true">
                    {twin.name.slice(0, 1)}
                  </div>
                )}
                <div className="twin-copy">
                  <span className={`role role-${twin.role}`}>{ROLE_COPY[twin.role]}</span>
                  <strong>{twin.name}</strong>
                  {twin.neighborhood ? <p>{twin.neighborhood}</p> : null}
                  {twin.website ? (
                    <a href={twin.website} target="_blank" rel="noreferrer">
                      Visit
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </Reveal>

      {result.week.length > 0 ? (
        <Reveal>
        <section id="week">
          <h3 className="section-title">Your first week</h3>
          <ol className="week">
            {result.week.map((stop) => (
              <li key={`${stop.day}-${stop.place.id}`}>
                <span className="day">{stop.day}</span>
                <div>
                  <strong>{stop.place.name}</strong>
                  <p>
                    {`${ROLE_COPY[stop.place.role]}${stop.place.neighborhood ? `, ${stop.place.neighborhood}` : ""}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        </Reveal>
      ) : (
        <div id="week" />
      )}

      <section className="panel pin-cta">
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => downloadItinerary(result, loves)}
          >
            Download itinerary
          </button>
          <button
            type="button"
            className="ghost"
            onClick={pinAnonymously}
            disabled={pinState === "saving" || pinState === "pinned"}
            aria-busy={pinState === "saving"}
          >
            {pinState === "pinned"
              ? "Pinned anonymously"
              : pinState === "saving"
                ? "Pinning…"
                : "Pin this landing"}
          </button>
          <button type="button" className="ghost" onClick={onChangeCity}>
            Try another city
          </button>
          <button type="button" className="ghost" onClick={onRestart}>
            Start over
          </button>
          {pinState === "error" ? (
            <p className="status status-bad">Could not pin. Your result is still only on this page.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
