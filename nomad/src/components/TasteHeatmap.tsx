"use client";

import type { HeatmapPoint } from "@/lib/types";

export function TasteHeatmap({
  points,
  destination,
}: {
  points: HeatmapPoint[];
  destination: string;
}) {
  if (points.length === 0) return null;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = (maxLat - minLat || 0.02) * 0.08;
  const padLng = (maxLng - minLng || 0.02) * 0.08;
  const width = 640;
  const height = 320;

  function x(lng: number) {
    return ((lng - (minLng - padLng)) / (maxLng - minLng + padLng * 2)) * width;
  }
  function y(lat: number) {
    return (
      (1 - (lat - (minLat - padLat)) / (maxLat - minLat + padLat * 2)) * height
    );
  }

  return (
    <div className="heatmap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Taste heatmap for ${destination}`}
      >
        {points.map((point, index) => (
          <circle
            key={`${point.lat}-${point.lng}-${index}`}
            cx={x(point.lng)}
            cy={y(point.lat)}
            r={2.4 + point.affinity * 4.2}
            fill="var(--accent)"
            opacity={0.18 + point.affinity * 0.55}
          />
        ))}
      </svg>
      <p className="heatmap-caption">
        Darker clusters are where your old-life taste is strongest in{" "}
        {destination}.
      </p>
    </div>
  );
}
