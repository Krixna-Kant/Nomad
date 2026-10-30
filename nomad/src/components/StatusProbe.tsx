"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  qloo?: { ok: boolean; latencyMs: number; sample: string | null };
  error?: string;
};

export function StatusProbe() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then(async (response) => {
        const body = (await response.json()) as Health;
        if (!cancelled) setHealth(body);
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false, error: "Could not reach the API" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return <p className="status">Checking Qloo…</p>;
  }

  if (!health.ok) {
    return (
      <p className="status status-bad">
        Qloo is not connected{health.error ? ` — ${health.error}` : ""}
      </p>
    );
  }

  return (
    <p className="status status-ok">
      Qloo is live
      {health.qloo?.latencyMs != null ? ` · ${health.qloo.latencyMs}ms` : ""}
      {health.qloo?.sample ? ` · resolved ${health.qloo.sample}` : ""}
    </p>
  );
}
