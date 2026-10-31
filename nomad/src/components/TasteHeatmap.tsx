"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { HeatmapPoint, TwinPlace } from "@/lib/types";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });
}

export function TasteHeatmap({
  points,
  destination,
  twins,
  neighborhoods,
}: {
  points: HeatmapPoint[];
  destination: string;
  twins: TwinPlace[];
  neighborhoods: { name: string; count: number }[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const located = twins.filter(
    (twin): twin is TwinPlace & { lat: number; lng: number } =>
      twin.lat != null && twin.lng != null,
  );
  const signature = `${destination}|${located.map((twin) => `${twin.id}:${twin.lat}:${twin.lng}`).join(",")}|${points.length}`;

  useEffect(() => {
    const node = host.current;
    if (!node || (located.length === 0 && points.length === 0)) return;

    let map: { remove: () => void; invalidateSize: () => void } | null = null;
    let alive = true;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default ?? leaflet;
      if (!alive || !node) return;

      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
        "#3d7ea6";
      const ink =
        getComputedStyle(document.documentElement).getPropertyValue("--color-accent-ink").trim() ||
        "#fff";

      const next = L.map(node, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      if (!alive) {
        next.remove();
        return;
      }
      map = next;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(next);

      const spots: [number, number][] = [];
      for (const twin of located) {
        spots.push([twin.lat, twin.lng]);
        L.circleMarker([twin.lat, twin.lng], {
          radius: 9,
          color: ink,
          weight: 2,
          fillColor: accent,
          fillOpacity: 1,
        })
          .bindPopup(
            `<strong>${escapeHtml(twin.name)}</strong>${
              twin.neighborhood ? `<br>${escapeHtml(twin.neighborhood)}` : ""
            }`,
          )
          .addTo(next);
      }

      if (spots.length === 0) {
        for (const point of points.slice(0, 40)) spots.push([point.lat, point.lng]);
      }

      if (spots.length === 1) {
        next.setView(spots[0], 14);
      } else if (spots.length > 1) {
        next.fitBounds(L.latLngBounds(spots).pad(0.28));
      }

      window.setTimeout(() => {
        if (alive) next.invalidateSize();
      }, 180);
    })();

    return () => {
      alive = false;
      map?.remove();
    };
    // signature already captures the places that should redraw the map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (located.length === 0 && points.length === 0) {
    if (neighborhoods.length === 0) return null;
    return (
      <div className="heatmap-board">
        <p className="heatmap-kicker">{destination}</p>
        <ul>
          {neighborhoods.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.count} matches</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="map-frame">
      <div
        ref={host}
        className="city-map"
        role="region"
        aria-label={`Map of matched places in ${destination}`}
      />
      {neighborhoods.length > 0 ? (
        <p className="heatmap-caption">
          {neighborhoods.map((item) => item.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
