"use client";

import { useEffect, useState } from "react";
import type { PublicPin, TwinRole } from "@/lib/types";

const ROLE_COPY: Record<TwinRole, string> = {
  restore: "Restore",
  stretch: "Stretch",
  gather: "Gather",
};

export function PinWall() {
  const [pins, setPins] = useState<PublicPin[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/pins");
      const body = (await response.json()) as { pins?: PublicPin[] };
      setPins(body.pins ?? []);
    } catch {
      setPins([]);
    }
  }

  useEffect(() => {
    void load();
    const onPinned = () => void load();
    window.addEventListener("nomad:pinned", onPinned);
    return () => window.removeEventListener("nomad:pinned", onPinned);
  }, []);

  return (
    <section className="wall" id="wall">
      <h2 className="section-title">Pinned landings</h2>
      {pins.length === 0 ? (
        <p className="lead">None yet. Pin a map after you make one.</p>
      ) : (
        <ul className="pin-grid">
          {pins.map((pin) => {
            const open = openId === pin.id;
            return (
              <li key={pin.id} className={open ? "pin open" : "pin"}>
                <button
                  type="button"
                  className="pin-head"
                  onClick={() => setOpenId(open ? null : pin.id)}
                  aria-expanded={open}
                >
                  <strong>
                    {pin.origin} to {pin.destination}
                  </strong>
                  <span>Someone from {pin.origin}</span>
                  {pin.tags.length > 0 ? (
                    <ul className="pin-tags">
                      {pin.tags.slice(0, 3).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                </button>
                {open ? (
                  <div className="pin-body">
                    {pin.loves.length > 0 ? (
                      <p>Loved: {pin.loves.map((love) => love.name).join(", ")}</p>
                    ) : null}
                    <ul className="pin-twins">
                      {pin.twins.slice(0, 5).map((twin) => (
                        <li key={`${pin.id}-${twin.name}`}>
                          <em>{ROLE_COPY[twin.role]}</em> {twin.name}
                          {twin.neighborhood ? `, ${twin.neighborhood}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
