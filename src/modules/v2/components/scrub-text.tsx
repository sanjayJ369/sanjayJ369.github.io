"use client";
import { useEffect, useRef } from "react";
import { clamp, prefersReducedMotion } from "../lib/motion";

// Words ink themselves in as the paragraph travels up the viewport.
export default function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".scrub-word"));
    if (prefersReducedMotion()) {
      words.forEach((w) => (w.style.opacity = "1"));
      return;
    }
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const n = words.length;
      words.forEach((w, i) => {
        const o = 0.14 + 0.86 * clamp(p * n * 1.15 - i);
        w.style.opacity = o.toFixed(3);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((w, i) => (
        <span key={i} className="scrub-word" aria-hidden>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
