"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

// First-visit-per-session loader. The inline script in the layout marks the
// document as ready immediately for repeat visits, which hides this via CSS.
export default function Preloader() {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<"loading" | "leaving" | "gone">("loading");
  const done = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("seen") || prefersReducedMotion()) {
      root.classList.add("is-ready");
      setState("gone");
      return;
    }
    let raf = 0;
    let shown = 0;
    let target = 60;
    const start = performance.now();
    Promise.all([
      document.fonts?.ready,
      new Promise((r) => (document.readyState === "complete" ? r(0) : window.addEventListener("load", r, { once: true }))),
    ]).then(() => (target = 100));

    const tick = (t: number) => {
      // Never finish faster than ~1.4s, so the count reads as a deliberate beat.
      const cap = Math.min(target, ((t - start) / 1400) * 100);
      shown += (cap - shown) * 0.08;
      if (cap >= 100 && 100 - shown < 0.6) shown = 100;
      setCount(Math.floor(shown));
      if (shown >= 100 && !done.current) {
        done.current = true;
        try {
          sessionStorage.setItem("v2-seen", "1");
        } catch {}
        window.setTimeout(() => {
          setState("leaving");
          root.classList.add("is-ready");
        }, 250);
        window.setTimeout(() => setState("gone"), 1700);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (state === "gone") return null;

  return (
    <div className="preloader" data-state={state} aria-hidden>
      <div className="preloader-inner">
        <p className="preloader-kicker mask">
          <span>The manifest of</span>
        </p>
        <p className="preloader-title mask">
          <span>Sanjay&nbsp;J</span>
        </p>
        <div className="preloader-bar">
          {Array.from({ length: 24 }, (_, i) => (
            <i key={i} data-on={count >= ((i + 1) / 24) * 100} />
          ))}
        </div>
        <p className="preloader-count mask">
          <span>{String(count).padStart(3, "0")}</span>
        </p>
      </div>
    </div>
  );
}
