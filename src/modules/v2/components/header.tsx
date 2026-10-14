"use client";
import { useEffect, useState } from "react";
import { PALETTES, PALETTE_EVENT, scroller } from "../lib/motion";
import TransitionLink from "./transition-link";

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

// Smooth-scroll to a section when it's on the current page.
function jump(e: React.MouseEvent, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  if (scroller.lenis) scroller.lenis.scrollTo(target, { duration: 1.6 });
  else target.scrollIntoView({ behavior: "smooth" });
}

export default function Header() {
  const [palette, setPalette] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const i = PALETTES.findIndex((p) => p.id === root.dataset.palette);
    setPalette(Math.max(0, i));
    setInverted(root.dataset.invert === "1");

    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 160);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const apply = (p: number, inv: boolean) => {
    const root = document.documentElement;
    root.classList.add("palette-shift");
    root.dataset.palette = PALETTES[p].id;
    root.dataset.invert = inv ? "1" : "0";
    store.set("v2-palette", PALETTES[p].id);
    store.set("v2-invert", inv ? "1" : "0");
    window.dispatchEvent(new Event(PALETTE_EVENT));
    window.setTimeout(() => root.classList.remove("palette-shift"), 700);
  };

  return (
    <header className="header" data-hidden={hidden}>
      <TransitionLink href="/v2/" className="header-mark" data-cursor="Home">
        <span>Sanjay J</span>
        <em>Logbook, Vol. II</em>
      </TransitionLink>
      <nav className="header-nav" aria-label="Primary">
        {[
          ["work", "Work"],
          ["log", "About"],
          ["contact", "Contact"],
        ].map(([id, label]) => (
          <a key={id} href={`/v2/#${id}`} onClick={(e) => jump(e, id)}>
            {label}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <button
          type="button"
          className="chip"
          data-cursor="Palette"
          onClick={() => {
            const next = (palette + 1) % PALETTES.length;
            setPalette(next);
            apply(next, inverted);
          }}
          aria-label={`Display palette: ${PALETTES[palette].name}. Click to change.`}
        >
          <span className="chip-swatch" aria-hidden />
          <span className="chip-label">{PALETTES[palette].name}</span>
        </button>
        <button
          type="button"
          className="chip chip--icon"
          data-cursor="Invert"
          aria-pressed={inverted}
          aria-label="Invert colours"
          onClick={() => {
            setInverted(!inverted);
            apply(palette, !inverted);
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" />
            <path d="M8 1a7 7 0 0 1 0 14z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
