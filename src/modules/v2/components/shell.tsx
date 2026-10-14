"use client";
import Lenis from "lenis";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { lerp, prefersReducedMotion, scroller } from "../lib/motion";

type CurtainState = "idle" | "cover" | "reveal";

// Module-level hook so <TransitionLink> can trigger the curtain from anywhere.
export const transition: { go: (href: string) => void } = {
  go: (href) => {
    window.location.href = href;
  },
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [curtain, setCurtain] = useState<CurtainState>("idle");
  const pending = useRef(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Smooth scroll
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: true, anchors: { duration: 1.6 } });
    scroller.lenis = lenis;
    lenis.on("scroll", (l: Lenis) => {
      scroller.velocity = l.velocity;
    });
    return () => {
      lenis.destroy();
      scroller.lenis = null;
    };
  }, []);

  // Page transitions
  useEffect(() => {
    transition.go = (href: string) => {
      if (pending.current) return;
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      pending.current = true;
      setCurtain("cover");
      window.setTimeout(() => router.push(href), 850);
    };
  }, [router]);

  useEffect(() => {
    const anchor = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (scroller.lenis) scroller.lenis.scrollTo(anchor || 0, { immediate: true, force: true });
    else if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, 0);
    // The element under the pointer changed without a pointermove; clear any hover label.
    if (cursorRef.current) cursorRef.current.dataset.state = "";
    if (!pending.current) return;
    pending.current = false;
    const t1 = window.setTimeout(() => setCurtain("reveal"), 120);
    const t2 = window.setTimeout(() => setCurtain("idle"), 1300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  // Scroll-triggered reveals
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );
    // Wait a frame so freshly-rendered route content is in the DOM.
    const id = requestAnimationFrame(() => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    });
    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
    };
  }, [pathname]);

  // Cursor
  useEffect(() => {
    const el = cursorRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor]");
      el.dataset.state = target ? "hover" : "";
      (el.firstElementChild as HTMLElement).dataset.label = target?.dataset.cursor ?? "";
    };
    const tick = () => {
      cx = lerp(cx, x, 0.2);
      cy = lerp(cy, y, 0.2);
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const leave = () => (el.dataset.state = "hidden");
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.classList.add("has-cursor");
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      {children}
      <div className="curtain" data-state={curtain} aria-hidden>
        <div className="curtain-edge curtain-edge--top" />
        <div className="curtain-body">
          <span className="curtain-mark">S.J.</span>
        </div>
        <div className="curtain-edge curtain-edge--bottom" />
      </div>
      <div ref={cursorRef} className="cursor" aria-hidden>
        <span className="cursor-dot" />
      </div>
      <div className="grain" aria-hidden />
    </>
  );
}
