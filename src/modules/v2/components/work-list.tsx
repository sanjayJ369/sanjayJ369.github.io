"use client";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../lib/projects";
import { lerp } from "../lib/motion";
import DitherImage from "./dither-image";
import TransitionLink from "./transition-link";

export default function WorkList({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(-1);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = preview.current!;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, rot = 0, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const tick = () => {
      const px = cx;
      cx = lerp(cx, x, 0.1);
      cy = lerp(cy, y, 0.1);
      rot = lerp(rot, Math.max(-12, Math.min(12, (cx - px) * 0.35)), 0.12);
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${rot}deg)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="work" onPointerLeave={() => setActive(-1)}>
      <ol className="work-list">
        {projects.map((p, i) => (
          <li key={p.slug} data-reveal style={{ "--i": i } as React.CSSProperties}>
            <TransitionLink
              href={`/v2/work/${p.slug}/`}
              className="work-row"
              data-cursor="Open"
              data-active={active === i}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <span className="work-no">No. {String(i + 1).padStart(2, "0")}</span>
              <span className="work-title">
                <span>{p.title}</span>
                <span aria-hidden>{p.title}</span>
              </span>
              <span className="work-desc">{p.description}</span>
              <span className="work-tags">{p.tags.slice(0, 3).join(" · ")}</span>
              <span className="work-year">{p.year}</span>
              <span className="work-arrow" aria-hidden>
                ↗
              </span>
            </TransitionLink>
          </li>
        ))}
      </ol>
      <div ref={preview} className="work-preview" data-on={active >= 0} aria-hidden>
        <div className="work-preview-frame">
          <div
            className="work-preview-strip"
            style={{ transform: `translate3d(0, ${-Math.max(0, active) * 100}%, 0)` }}
          >
            {projects.map((p) => (
              <div key={p.slug} className="work-preview-cell">
                {p.image && <DitherImage src={p.image} alt="" pixel={2} develop={false} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
