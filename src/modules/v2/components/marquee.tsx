"use client";
import { useEffect, useRef } from "react";
import { lerp, prefersReducedMotion, scroller } from "../lib/motion";

// A slow ticker that speeds up, reverses and leans with scroll velocity.
export default function Marquee({ items, speed = 0.35 }: { items: string[]; speed?: number }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current!;
    if (prefersReducedMotion()) return;
    let x = 0, v = 0, skew = 0, dir = 1, raf = 0;
    const tick = () => {
      const sv = scroller.velocity;
      if (Math.abs(sv) > 0.5) dir = Math.sign(sv);
      v = lerp(v, speed * dir + sv * 0.12, 0.08);
      skew = lerp(skew, Math.max(-8, Math.min(8, sv * 0.25)), 0.1);
      const half = el.scrollWidth / 2;
      x -= v;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const row = items.map((item, i) => (
    <span key={i} className="marquee-item">
      {item}
      <span className="marquee-sep" aria-hidden>
        ✳
      </span>
    </span>
  ));

  return (
    <div className="marquee" aria-label={items.join(", ")}>
      <div ref={track} className="marquee-track" aria-hidden>
        <span className="marquee-row">{row}</span>
        <span className="marquee-row">{row}</span>
      </div>
    </div>
  );
}
