"use client";

import { useEffect, useMemo, useState } from "react";
import { TasteHeatmap } from "@/components/TasteHeatmap";
import type { ResolvedEntity, TransplantResult, TwinRole } from "@/lib/types";

type Step = "old" | "new" | "results";

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
  "Reading the cultural signals in what you loved…",
  "Looking for twins that are not just the same category…",
  "Mapping the neighborhoods where that taste still lives…",
  "Laying a first week of recurring places, not a tourist list…",
];

function kindLabel(kind: string) {
  return kind;
}

export function NomadFlow() {
  const [step, setStep] = useState<Step>("old");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loves, setLoves] = useState<ResolvedEntity[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ResolvedEntity[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadLine, setLoadLine] = useState(LOADING_LINES[0]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransplantResult | null>(null);

  const canLeaveOld = origin.trim().length > 1 && loves.length >= 2;
  const selectedIds = useMemo(() => new Set(loves.map((item) => item.id)), [loves]);

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

  function addLove(entity: ResolvedEntity) {
    if (loves.length >= 6) return;
    setLoves((current) =>
      current.some((item) => item.id === entity.id)
        ? current
        : [...current, entity],
    );
    setQuery("");
    setHits([]);
  }

  function removeLove(id: string) {
    setLoves((current) => current.filter((item) => item.id !== id));
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
      setOrigin("Seoul");
      setDestination("Montreal");
      setLoves(found);
      setQuery("");
      setHits([]);
    } catch {
      setError("Could not load the demo taste profile.");
    } finally {
      setLoadingDemo(false);
    }
  }

  async function runTransplant() {
    if (!canLeaveOld || destination.trim().length < 2) return;
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
          loves,
        }),
      });
      const body = (await response.json()) as TransplantResult & { error?: string };
      if (!response.ok) throw new Error(body.error || "Transplant failed");
      setResult(body);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transplant failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ol className="steps" aria-label="Progress">
        <li className={step === "old" ? "current" : "done"}>Old life</li>
        <li className={step === "new" ? "current" : step === "results" ? "done" : ""}>
          New city
        </li>
        <li className={step === "results" ? "current" : ""}>Your map</li>
      </ol>

      {step === "old" ? (
        <section className="panel">
          <div className="panel-kicker">Step 1 · the life you left</div>
          <h2>Where are you coming from, and what did you love there?</h2>
          <p className="lede">
            Start with the old city. Then add cafes, bookstores, venues, artists,
            or films that actually felt like you — not the famous ones you were
            supposed to like.
          </p>

          <label className="field">
            <span>Old city</span>
            <input
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="Seoul, Berlin, Bangalore…"
            />
          </label>

          <label className="field">
            <span>Things you loved there · {loves.length}/6</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="A cafe, artist, bookstore, film…"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (hits[0]) addLove(hits[0]);
                }
              }}
            />
          </label>
          {searching ? <p className="status">Searching Qloo…</p> : null}
          {hits.length > 0 ? (
            <ul className="suggest">
              {hits.slice(0, 6).map((hit) => (
                <li key={`${hit.id}-${hit.kind}`}>
                  <button type="button" onClick={() => addLove(hit)}>
                    <strong>{hit.name}</strong>
                    <span>
                      {kindLabel(hit.kind)}
                      {hit.city ? ` · ${hit.city}` : ""}
                      {hit.disambiguation && hit.disambiguation !== hit.name
                        ? ` · ${hit.disambiguation}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {loves.length > 0 ? (
            <ul className="chips">
              {loves.map((love) => (
                <li key={love.id}>
                  <span>
                    {love.name}
                    <em>{love.kind}</em>
                  </span>
                  <button type="button" onClick={() => removeLove(love.id)} aria-label={`Remove ${love.name}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {error ? <p className="status status-bad">{error}</p> : null}

          <div className="actions">
            <button type="button" onClick={() => setStep("new")} disabled={!canLeaveOld}>
              Continue to the new city
            </button>
            <button type="button" className="ghost" onClick={loadDemo} disabled={loadingDemo}>
              {loadingDemo ? "Loading Maya…" : "Try Maya: Seoul → Montreal"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "new" ? (
        <section className="panel">
          <div className="panel-kicker">Step 2 · where taste should land</div>
          <h2>Where are you trying to feel at home now?</h2>
          <p className="lede">
            We already have your old life
            {origin ? ` in ${origin}` : ""}
            {loves.length ? ` — ${loves.map((item) => item.name).join(", ")}.` : "."}{" "}
            Now we look for cultural twins, not popular lists.
          </p>

          <label className="field">
            <span>New city</span>
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Montreal, Lisbon, Berlin…"
            />
          </label>

          {error ? <p className="status status-bad">{error}</p> : null}
          {loading ? <p className="status">{loadLine}</p> : null}

          <div className="actions">
            <button
              type="button"
              onClick={runTransplant}
              disabled={loading || destination.trim().length < 2}
            >
              {loading ? "Transplanting…" : "Transplant my taste"}
            </button>
            <button type="button" className="ghost" onClick={() => setStep("old")} disabled={loading}>
              Back to old life
            </button>
          </div>
        </section>
      ) : null}

      {step === "results" && result ? (
        <ResultsView
          result={result}
          loves={loves}
          onRestart={() => {
            setStep("old");
            setResult(null);
            setError(null);
          }}
          onChangeCity={() => {
            setStep("new");
            setResult(null);
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
  return (
    <div className="results">
      <section className="panel">
        <div className="panel-kicker">Taste DNA</div>
        <h2>
          {result.origin} → {result.destination}
        </h2>
        <p className="lede">{result.dna.portrait}</p>
        <ul className="dna">
          {result.dna.tags.map((tag) => (
            <li key={tag.name}>{tag.name}</li>
          ))}
        </ul>
        <p className="from-loves">
          Grown from {loves.map((item) => item.name).join(" · ")}
        </p>
      </section>

      {result.neighborhoods.length > 0 ? (
        <p className="neighborhoods">
          Your taste clusters in{" "}
          {result.neighborhoods.map((item) => item.name).join(", ")}.
        </p>
      ) : null}

      <TasteHeatmap points={result.heatmap} destination={result.destination} />

      <section>
        <div className="panel-kicker">Cultural twins</div>
        <h3 className="section-title">Places that continue the old life</h3>
        {result.twins.length === 0 ? (
          <p className="lede">
            Qloo did not return reliable matches in {result.destination} for
            this mix. Try another city, or add a more specific place from home.
          </p>
        ) : (
          <ul className="twins">
            {result.twins.map((twin) => (
              <li key={twin.id}>
                <div className="twin-top">
                  <span className={`role role-${twin.role}`}>
                    {ROLE_COPY[twin.role]}
                  </span>
                  <strong>{twin.name}</strong>
                </div>
                <p>
                  {twin.neighborhood ? `${twin.neighborhood} · ` : ""}
                  {twin.primaryGenre ? `${twin.primaryGenre} · ` : ""}
                  affinity {twin.affinity.toFixed(2)}
                </p>
                <p className="because">{twin.because}</p>
                {twin.website ? (
                  <a href={twin.website} target="_blank" rel="noreferrer">
                    Visit
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {result.week.length > 0 ? (
        <section>
          <div className="panel-kicker">First-week trail</div>
          <h3 className="section-title">Recurring places, not a packed itinerary</h3>
          <ol className="week">
            {result.week.map((stop) => (
              <li key={`${stop.day}-${stop.place.id}`}>
                <span className="day">{stop.day}</span>
                <div>
                  <strong>{stop.place.name}</strong>
                  <p>
                    {ROLE_COPY[stop.place.role]}
                    {stop.place.neighborhood ? ` · ${stop.place.neighborhood}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="actions">
        <button type="button" className="ghost" onClick={onChangeCity}>
          Try another city
        </button>
        <button type="button" className="ghost" onClick={onRestart}>
          Start over
        </button>
      </div>
    </div>
  );
}
