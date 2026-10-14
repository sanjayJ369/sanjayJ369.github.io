"use client";
import type Lenis from "lenis";

// Shared handle on the Lenis instance so any component can read scroll state.
export const scroller: { lenis: Lenis | null; velocity: number } = {
  lenis: null,
  velocity: 0,
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Two-tone display palettes, after the 1-bit display modes in Return of the Obra Dinn.
export const PALETTES = [
  { id: "ibm-8503", name: "IBM 8503", ink: "#2e3037", paper: "#ebe5ce" },
  { id: "macintosh", name: "Macintosh", ink: "#333319", paper: "#e5ffff" },
  { id: "zenith", name: "Zenith ZVM 1240", ink: "#3f291e", paper: "#fdca55" },
  { id: "ibm-5151", name: "IBM 5151", ink: "#25342f", paper: "#01eb5f" },
  { id: "commodore", name: "Commodore 1084", ink: "#40318e", paper: "#88d7de" },
  { id: "lcd", name: "LCD", ink: "#000000", paper: "#ffffff" },
] as const;

export function readInk() {
  const s = getComputedStyle(document.documentElement);
  return {
    ink: s.getPropertyValue("--ink").trim() || "#2e3037",
    paper: s.getPropertyValue("--paper").trim() || "#ebe5ce",
  };
}

export const PALETTE_EVENT = "v2:palette";
