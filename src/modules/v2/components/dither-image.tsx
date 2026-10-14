"use client";
import { useEffect, useRef } from "react";
import { PALETTE_EVENT, clamp, easeOutExpo, lerp, prefersReducedMotion, readInk } from "../lib/motion";

// 8x8 Bayer matrix, normalised to (0,1).
const BAYER = (() => {
  let m = [[0]];
  while (m.length < 8) {
    const n = m.length;
    const next: number[][] = Array.from({ length: n * 2 }, () => Array(n * 2).fill(0));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    m = next;
  }
  return Float32Array.from(m.flat().map((v) => (v + 0.5) / 64));
})();

function hexToABGR(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
}

type Props = {
  src: string;
  alt: string;
  /** Size of one dither dot in CSS pixels. */
  pixel?: number;
  /** Animate the image "developing" when it scrolls into view. */
  develop?: boolean;
  /** A soft light that follows the pointer. */
  light?: boolean;
  /** Brightness offset, -1..1 */
  exposure?: number;
  className?: string;
};

export default function DitherImage({
  src,
  alt,
  pixel = 2,
  develop = true,
  light = false,
  exposure = 0,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = prefersReducedMotion();
    let img: HTMLImageElement | null = null;
    let lum = new Float32Array(0);
    let w = 0, h = 0;
    let data: ImageData | null = null;
    let out: Uint32Array = new Uint32Array(0);
    let ink = 0, paper = 0;
    let progress = develop && !reduced ? 0 : 1;
    let startedAt = -1;
    let visible = false;
    let raf = 0;
    const pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, on: 0, ton: 0 };
    let dirty = true;

    const colours = () => {
      const c = readInk();
      ink = hexToABGR(c.ink);
      paper = hexToABGR(c.paper);
      dirty = true;
    };

    const sample = () => {
      if (!img) return;
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      w = Math.max(8, Math.ceil(cw / pixel));
      h = Math.max(8, Math.ceil(ch / pixel));
      canvas.width = w;
      canvas.height = h;
      // object-fit: cover
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const px = ctx.getImageData(0, 0, w, h).data;
      lum = new Float32Array(w * h);
      let lo = 1, hi = 0;
      for (let i = 0; i < w * h; i++) {
        const l = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
        lum[i] = l;
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
      // Auto-levels so flat screenshots still dither with some drama.
      const range = Math.max(0.05, hi - lo);
      for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - lo) / range;
      data = ctx.createImageData(w, h);
      out = new Uint32Array(data.data.buffer);
      dirty = true;
    };

    const render = () => {
      if (!data || !lum.length) return;
      const lit = light && pointer.on > 0.001;
      const lx = pointer.x * w, ly = pointer.y * h;
      const radius = Math.max(w, h) * 0.45;
      for (let y = 0; y < h; y++) {
        const p = progress >= 1 ? 1 : easeOutExpo(clamp(progress * 1.35 - (y / h) * 0.35));
        const bias = exposure - 1.15 * (1 - p);
        const row = y * w;
        const by = (y & 7) << 3;
        for (let x = 0; x < w; x++) {
          let l = lum[row + x] + bias;
          if (lit) {
            const dx = x - lx, dy = y - ly;
            const d = Math.sqrt(dx * dx + dy * dy) / radius;
            l += pointer.on * (0.38 * Math.max(0, 1 - d * d) - 0.14);
          }
          out[row + x] = l > BAYER[by + (x & 7)] ? paper : ink;
        }
      }
      ctx.putImageData(data, 0, 0);
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (progress < 1) {
        if (startedAt < 0) startedAt = t;
        progress = Math.min(1, (t - startedAt) / 1800);
        dirty = true;
      }
      if (light) {
        const nx = lerp(pointer.x, pointer.tx, 0.09);
        const ny = lerp(pointer.y, pointer.ty, 0.09);
        const non = lerp(pointer.on, pointer.ton, 0.06);
        if (Math.abs(nx - pointer.x) + Math.abs(ny - pointer.y) + Math.abs(non - pointer.on) > 0.0005) {
          pointer.x = nx;
          pointer.y = ny;
          pointer.on = non;
          dirty = true;
        }
      }
      if (dirty) {
        dirty = false;
        render();
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = (e.clientY - r.top) / r.height;
      const inside = pointer.tx > -0.3 && pointer.tx < 1.3 && pointer.ty > -0.3 && pointer.ty < 1.3;
      pointer.ton = inside ? 1 : 0;
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    const ro = new ResizeObserver(() => sample());

    colours();
    img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      sample();
      io.observe(canvas);
      ro.observe(canvas);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener(PALETTE_EVENT, colours);
    if (light && !reduced && window.matchMedia("(pointer: fine)").matches)
      window.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener(PALETTE_EVENT, colours);
      window.removeEventListener("pointermove", onMove);
      if (img) img.onload = null;
    };
  }, [src, pixel, develop, light, exposure]);

  return <canvas ref={ref} className={`dither ${className ?? ""}`} role="img" aria-label={alt} />;
}
