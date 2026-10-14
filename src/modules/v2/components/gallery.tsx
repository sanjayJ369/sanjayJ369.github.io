"use client";
import { useEffect, useRef } from "react";
import type { Project } from "../lib/projects";
import { clamp, lerp, prefersReducedMotion } from "../lib/motion";
import DitherImage from "./dither-image";
import TransitionLink from "./transition-link";

// Vertical scroll drives a pinned horizontal track.
export default function Gallery({ projects }: { projects: Project[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const s = section.current!, t = track.current!, b = bar.current!;
    const wide = window.matchMedia("(min-width: 800px)");
    if (prefersReducedMotion()) return;
    let raf = 0, shown = 0;

    const size = () => {
      s.style.height = wide.matches ? `${t.scrollWidth - window.innerWidth + window.innerHeight}px` : "";
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!wide.matches) {
        t.style.transform = "";
        return;
      }
      const r = s.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight));
      shown = lerp(shown, p, 0.14);
      const dist = t.scrollWidth - window.innerWidth;
      t.style.transform = `translate3d(${-shown * dist}px,0,0)`;
      b.style.transform = `scaleX(${shown})`;
      t.querySelectorAll<HTMLElement>(".gallery-media-inner").forEach((m, i, all) => {
        const local = shown * (all.length - 1) - i;
        m.style.transform = `translate3d(${local * -8}%,0,0) scale(1.18)`;
      });
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(t);
    wide.addEventListener("change", size);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wide.removeEventListener("change", size);
    };
  }, []);

  return (
    <section ref={section} className="gallery" aria-label="Selected entries">
      <div className="gallery-pin">
        <div className="gallery-head">
          <span className="label">II. Selected entries</span>
          <span className="gallery-progress" aria-hidden>
            <span ref={bar} />
          </span>
        </div>
        <div ref={track} className="gallery-track">
          <div className="gallery-intro">
            <h2 className="display">
              Things
              <br />
              <em>worth</em> a
              <br />
              closer look.
            </h2>
            <p>
              Scroll on. Each plate is rendered live in two tones, in your browser, as it comes into
              view.
            </p>
          </div>
          {projects.map((p, i) => (
            <TransitionLink
              key={p.slug}
              href={`/v2/work/${p.slug}/`}
              className="gallery-card"
              data-cursor="Read entry"
            >
              <div className="gallery-media">
                <div className="gallery-media-inner">
                  {p.image && <DitherImage src={p.image} alt={p.title} pixel={2} />}
                </div>
              </div>
              <div className="gallery-meta">
                <span className="label">Plate {["I", "II", "III", "IV", "V"][i]}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
