"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { id: "why", label: "Why" },
  { id: "how", label: "How" },
  { id: "try", label: "Try" },
  { id: "wall", label: "Pins" },
] as const;

function go(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

export function SiteNav() {
  const [afloat, setAfloat] = useState(false);

  useEffect(() => {
    const onScroll = () => setAfloat(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={afloat ? "nav is-afloat" : "nav"} aria-label="Page">
      <div className="nav-inner">
        <a
          className="wordmark"
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            go("top");
          }}
        >
          Nomad
        </a>
        <ul className="nav-links">
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  go(link.id);
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
