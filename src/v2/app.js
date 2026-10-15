(() => {
  "use strict";

  const PROJECTS = window.__PROJECTS__ || [];
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ------------------------------------------------------------------
     Palettes: each drives both the dither and the page colours.
     ------------------------------------------------------------------ */
  const PALETTES = [
    { id: "wired", colours: ["#0b0710", "#2a0d1c", "#5a1030", "#e0284f", "#ff8fb1", "#efe4e1", "#6fd3ff", "#3a2a5e"] },
    { id: "navi", colours: ["#05070d", "#10224a", "#2e5fd6", "#7ad7ff", "#c9b8ff", "#eef0ff", "#ff4f9a", "#1a1030"] },
    { id: "phosphor", colours: ["#050a06", "#0c2a14", "#17602a", "#39ff6a", "#b8ffbf", "#ffb84a", "#5a3a10", "#d8ffd9"] },
    { id: "copland", colours: ["#0e0a05", "#2e1d08", "#7a3e0c", "#ff9a1f", "#ffd27a", "#fff1d6", "#8fd0ff", "#3b4a6b"] },
  ];
  let paletteIndex = Math.max(0, PALETTES.findIndex((p) => p.id === store.get("v2-dither")));
  let paletteRGB = [];

  function applyPalette() {
    const p = PALETTES[paletteIndex];
    root.dataset.palette = p.id;
    paletteRGB = p.colours.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    });
    $("#palette-swatch").innerHTML = [3, 6, 4, 2].map((i) => `<i style="background:${p.colours[i]}"></i>`).join("");
    Dither.all.forEach((d) => (d.dirty = true));
  }

  /* ------------------------------------------------------------------
     Colour ordered dithering: an 8x8 Bayer offset per channel, then the
     nearest palette colour. Images develop in from dark; the portrait
     also carries a pointer-driven lamp.
     ------------------------------------------------------------------ */
  const BAYER = (() => {
    let m = [[0]];
    while (m.length < 8) {
      const n = m.length;
      const next = Array.from({ length: n * 2 }, () => new Array(n * 2).fill(0));
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const v = m[y][x] * 4;
          next[y][x] = v; next[y][x + n] = v + 2; next[y + n][x] = v + 3; next[y + n][x + n] = v + 1;
        }
      m = next;
    }
    return Float32Array.from(m.flat().map((v) => (v + 0.5) / 64 - 0.5));
  })();

  class Dither {
    static all = new Set();
    static pointer = { x: -1e4, y: -1e4 };

    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { willReadFrequently: true });
      this.pixel = Number(canvas.dataset.pixel || 2);
      this.lamp = canvas.hasAttribute("data-lamp");
      this.visible = false;
      this.light = { x: 0.5, y: 0.4, on: 0 };
      this.dirty = true;
      Dither.all.add(this);
      Dither.io.observe(canvas);
      new ResizeObserver(() => this.sample()).observe(canvas);
      if (canvas.dataset.src) this.load(canvas.dataset.src);
    }

    load(src, onDeveloped) {
      this.src = src;
      this.src32 = null;
      this.progress = reduced ? 1 : 0;
      this.start = -1;
      this.onDeveloped = onDeveloped;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (this.src !== src) return;
        this.img = img;
        this.sample();
      };
      img.src = src;
    }

    sample() {
      const { canvas, img } = this;
      if (!img) return;
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      const w = (this.w = Math.max(8, Math.ceil(cw / this.pixel)));
      const h = (this.h = Math.max(8, Math.ceil(ch / this.pixel)));
      canvas.width = w;
      canvas.height = h;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      this.ctx.imageSmoothingQuality = "high";
      this.ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const px = this.ctx.getImageData(0, 0, w, h).data;
      // Stretch levels so flat screenshots still read.
      let lo = 255, hi = 0;
      for (let i = 0; i < px.length; i += 4) {
        const l = (px[i] + px[i + 1] + px[i + 2]) / 3;
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
      const k = 255 / Math.max(24, hi - lo);
      this.src32 = new Float32Array((px.length / 4) * 3);
      for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
        this.src32[j] = (px[i] - lo) * k;
        this.src32[j + 1] = (px[i + 1] - lo) * k;
        this.src32[j + 2] = (px[i + 2] - lo) * k;
      }
      this.out = this.ctx.createImageData(w, h);
      this.out32 = new Uint32Array(this.out.data.buffer);
      this.dirty = true;
    }

    render() {
      const { w, h, src32, out32 } = this;
      const pal = paletteRGB, pn = pal.length;
      const packed = pal.map(([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
      const lit = this.lamp && this.light.on > 0.01;
      const lx = this.light.x * w, ly = this.light.y * h, rad = Math.max(w, h) * 0.42;
      for (let y = 0; y < h; y++) {
        const p = this.progress >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(this.progress * 1.4 - (y / h) * 0.4));
        const bias = -230 * (1 - p);
        const by = (y & 7) << 3;
        for (let x = 0; x < w; x++) {
          const j = (y * w + x) * 3;
          let add = bias + BAYER[by + (x & 7)] * 64;
          if (lit) {
            const dx = x - lx, dy = y - ly;
            const d = Math.sqrt(dx * dx + dy * dy) / rad;
            add += this.light.on * (110 * Math.max(0, 1 - d * d) - 40);
          }
          const r = src32[j] + add, g = src32[j + 1] + add, b = src32[j + 2] + add;
          let best = 0, bestD = Infinity;
          for (let c = 0; c < pn; c++) {
            const q = pal[c];
            const dr = r - q[0], dg = g - q[1], db = b - q[2];
            const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
            if (dd < bestD) { bestD = dd; best = c; }
          }
          out32[y * w + x] = packed[best];
        }
      }
      this.ctx.putImageData(this.out, 0, 0);
    }

    tick(now) {
      if (!this.visible || !this.src32) return;
      if (this.progress < 1) {
        if (this.start < 0) this.start = now;
        this.progress = Math.min(1, (now - this.start) / 1600);
        this.dirty = true;
        if (this.progress === 1 && this.onDeveloped) this.onDeveloped();
      }
      if (this.lamp && finePointer && !reduced) {
        const r = this.canvas.getBoundingClientRect();
        const tx = (Dither.pointer.x - r.left) / r.width, ty = (Dither.pointer.y - r.top) / r.height;
        const inside = tx > -0.4 && tx < 1.4 && ty > -0.4 && ty < 1.4 ? 1 : 0;
        const nx = lerp(this.light.x, tx, 0.1), ny = lerp(this.light.y, ty, 0.1), no = lerp(this.light.on, inside, 0.07);
        if (Math.abs(nx - this.light.x) + Math.abs(ny - this.light.y) + Math.abs(no - this.light.on) > 0.0008) {
          Object.assign(this.light, { x: nx, y: ny, on: no });
          this.dirty = true;
        }
      }
      if (this.dirty) {
        this.dirty = false;
        this.render();
      }
    }
  }
  Dither.io = new IntersectionObserver((entries) => {
    for (const e of entries) for (const d of Dither.all) if (d.canvas === e.target) d.visible = e.isIntersecting;
  }, { rootMargin: "120px 0px" });

  /* ------------------------------------------------------------------
     Smooth scrolling: wheel input eases toward a target. Touch, keys and
     the scrollbar stay native and simply resync the target.
     ------------------------------------------------------------------ */
  const scroller = {
    enabled: finePointer && !reduced,
    locked: false,
    target: scrollY,
    current: scrollY,
    running: false,
    to(y) {
      this.target = clamp(y, 0, root.scrollHeight - innerHeight);
      if (!this.enabled) { scrollTo({ top: this.target, behavior: reduced ? "auto" : "smooth" }); return; }
      if (this.running) return;
      this.running = true;
      const step = () => {
        this.current = lerp(this.current, this.target, 0.085);
        if (Math.abs(this.target - this.current) < 0.4) { this.current = this.target; this.running = false; }
        scrollTo(0, this.current);
        if (this.running) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  };
  if (scroller.enabled) {
    root.style.scrollBehavior = "auto";
    addEventListener("wheel", (e) => {
      if (e.ctrlKey || scroller.locked || e.target.closest("[data-native-scroll]")) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
      scroller.to(scroller.target + e.deltaY * unit);
    }, { passive: false });
  }
  let lastY = scrollY;
  const bar = $(".bar");
  addEventListener("scroll", () => {
    if (!scroller.running) scroller.target = scroller.current = scrollY;
    // Header steps aside while reading down, returns on the way up.
    const y = scrollY;
    if (Math.abs(y - lastY) > 6) { bar.classList.toggle("hide", y > lastY && y > 200); lastY = y; }
  }, { passive: true });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const el = document.getElementById(a.getAttribute("href").slice(1));
    if (!el) return;
    e.preventDefault();
    scroller.to(el.id === "top" ? 0 : el.getBoundingClientRect().top + scrollY - 40);
  });

  /* ------------------------------------------------------------------
     Text scramble on hover
     ------------------------------------------------------------------ */
  const GLYPHS = "アイウエオカキクケコサシスセソ01#%&/<>_=+*";
  function scramble(el) {
    if (reduced) return;
    const text = (el.dataset.final ||= el.textContent);
    const start = performance.now(), dur = 300 + text.length * 30;
    cancelAnimationFrame(el._scr);
    const frame = (t) => {
      const p = clamp((t - start) / dur);
      const fixed = Math.floor(p * text.length);
      let s = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) s += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s;
      if (p < 1) el._scr = requestAnimationFrame(frame);
    };
    el._scr = requestAnimationFrame(frame);
  }
  document.addEventListener("pointerover", (e) => {
    const host = e.target.closest("a, button");
    if (!host || host.contains(e.relatedTarget)) return;
    const el = host.matches("[data-scramble]") ? host : host.querySelector("[data-scramble]");
    if (el && el.children.length === 0) scramble(el);
  });

  /* ------------------------------------------------------------------
     Content
     ------------------------------------------------------------------ */
  $("#work-list").innerHTML = PROJECTS.map((p, i) => `
    <li class="reveal" style="--delay:${(i % 5) * 0.05}s">
      <button type="button" class="work-row" data-slug="${p.slug}">
        <span class="work-name"><span data-scramble>${p.title}</span></span>
        <span class="work-desc">${p.description}</span>
        <span class="work-year">${p.date.slice(0, 4)}</span>
      </button>
    </li>`).join("");

  const scrub = $("#scrub");
  scrub.setAttribute("aria-label", scrub.textContent);
  scrub.innerHTML = scrub.textContent.split(" ").map((w) => `<span class="w" aria-hidden="true">${w} </span>`).join("");
  const scrubWords = $$(".w", scrub);

  // Preview canvases for the work list.
  const peek = $("#peek"), peekFrame = $("#peek-frame");
  if (finePointer) {
    peekFrame.innerHTML = PROJECTS.filter((p) => p.image)
      .map((p) => `<canvas class="dither" data-src="${p.image}" data-pixel="2" data-slug="${p.slug}"></canvas>`).join("");
  }

  applyPalette();
  $$("canvas.dither[data-src]").forEach((c) => new Dither(c));
  const plateDither = new Dither($("#entry-canvas"));

  $("#palette-btn").addEventListener("click", () => {
    paletteIndex = (paletteIndex + 1) % PALETTES.length;
    store.set("v2-dither", PALETTES[paletteIndex].id);
    applyPalette();
  });

  /* ------------------------------------------------------------------
     Project window
     ------------------------------------------------------------------ */
  const entry = $("#entry"), plate = $("#entry-plate"), plateImg = $("#entry-img");
  let lastFocus = null;

  function setHash(hash) {
    try { history.replaceState(null, "", hash || location.pathname + location.search); } catch { /* sandboxed */ }
  }

  function fill(slug) {
    const i = PROJECTS.findIndex((p) => p.slug === slug);
    const p = PROJECTS[i];
    if (!p) return false;
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const title = $("#entry-title");
    title.textContent = title.dataset.text = p.title;
    $("#entry-lede").textContent = p.description;
    const [y, m, d] = p.date.split("-");
    const month = new Date(Date.UTC(+y, +m - 1, +d)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
    $("#entry-meta").innerHTML = `
      <div><dt>Date</dt><dd>${month} ${y}</dd></div>
      <div><dt>Stack</dt><dd>${p.tags.slice(0, 4).join(", ")}</dd></div>
      ${p.repo ? `<div><dt>Code</dt><dd><a href="${p.repo}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></dd></div>` : ""}
      ${p.demo ? `<div><dt>Live</dt><dd><a href="${p.demo}" target="_blank" rel="noopener noreferrer">Try it ↗</a></dd></div>` : ""}`;
    plate.hidden = !p.image;
    plate.classList.remove("clear");
    if (p.image) {
      plateImg.src = p.image;
      plateImg.alt = p.title;
      // Develop as a dither, then settle into the real image.
      plateDither.load(p.image, () => plate.classList.add("clear"));
    }
    const body = $("#entry-body");
    body.innerHTML = p.html;
    // The plate already shows the cover image; drop it from the write-up.
    $$("img", body).forEach((img) => {
      if (p.image && img.getAttribute("src") === p.image) (img.closest("p") || img).remove();
      else { img.loading = "lazy"; img.alt ||= ""; }
    });
    $$("a", body).forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    $("#entry-next-title").textContent = `${next.title} →`;
    $("#entry-next").dataset.slug = next.slug;
    $("#entry-scroll").scrollTop = 0;
    return true;
  }

  function open(slug) {
    if (!fill(slug)) return;
    if (entry.hidden) {
      lastFocus = document.activeElement;
      entry.hidden = false;
      scroller.locked = true;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => entry.classList.add("open")));
      $(".entry-close").focus({ preventScroll: true });
    }
    if (reduced) plate.classList.add("clear");
    glitch($("#entry-title"));
    setHash(`#${slug}`);
  }

  function close() {
    if (entry.hidden) return;
    entry.classList.remove("open");
    scroller.locked = false;
    document.body.style.overflow = "";
    setTimeout(() => { if (!entry.classList.contains("open")) entry.hidden = true; }, reduced ? 0 : 650);
    $$("video", entry).forEach((v) => v.pause());
    setHash("");
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("button[data-slug]");
    if (trigger) open(trigger.dataset.slug);
    else if (e.target.closest("[data-close]")) close();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab" && !entry.hidden) {
      const f = $$('button, a[href], video[controls]', entry).filter((el) => el.offsetParent);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------------------------------------------
     Glitch: on open, and now and then on the name.
     ------------------------------------------------------------------ */
  function glitch(el) {
    if (reduced || !el) return;
    el.classList.remove("is-glitching");
    void el.offsetWidth;
    el.classList.add("is-glitching");
    setTimeout(() => el.classList.remove("is-glitching"), 460);
  }
  const name = $(".hero h1");
  setTimeout(() => glitch(name), 1100);
  if (!reduced) {
    (function loop() {
      if (name.getBoundingClientRect().bottom > 0) glitch(name);
      setTimeout(loop, 9000 + Math.random() * 7000);
    })();
  }

  /* ------------------------------------------------------------------
     Reveal content that starts below the fold
     ------------------------------------------------------------------ */
  if (!reduced) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("revealing");
        e.target.classList.remove("pending");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -6% 0px" });
    $$(".reveal, .section > .label, .facts > div, .links li, .scrub").forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add("pending");
        io.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------
     Clock
     ------------------------------------------------------------------ */
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const tick = () => ($("#clock").textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 10000);

  /* ------------------------------------------------------------------
     Pointer: crosshair cursor and the work-list preview
     ------------------------------------------------------------------ */
  const cursor = $("#cursor");
  let mouse = { x: -100, y: -100 }, cpos = { ...mouse }, ppos = { ...mouse }, peeking = false;
  addEventListener("pointermove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    Dither.pointer = mouse;
    cursor.classList.toggle("hover", !!e.target.closest("a, button"));
  }, { passive: true });
  if (finePointer && !reduced) root.classList.add("has-cursor");

  const peekCanvases = $$("canvas", peekFrame);
  $$(".work-row").forEach((row) => {
    row.addEventListener("pointerenter", () => {
      const slug = row.dataset.slug;
      peekCanvases.forEach((c) => c.classList.toggle("on", c.dataset.slug === slug));
      peeking = peekCanvases.some((c) => c.dataset.slug === slug);
      peek.classList.toggle("on", peeking);
    });
  });
  $("#work-list").addEventListener("pointerleave", () => { peeking = false; peek.classList.remove("on"); });

  /* ------------------------------------------------------------------
     Frame loop
     ------------------------------------------------------------------ */
  function frame(now) {
    requestAnimationFrame(frame);
    cpos.x = lerp(cpos.x, mouse.x, 0.35);
    cpos.y = lerp(cpos.y, mouse.y, 0.35);
    cursor.style.transform = `translate3d(${cpos.x}px, ${cpos.y}px, 0)`;

    if (peeking) {
      ppos.x = lerp(ppos.x, mouse.x, 0.14);
      ppos.y = lerp(ppos.y, mouse.y, 0.14);
      peek.style.transform = `translate3d(${ppos.x}px, ${ppos.y}px, 0)`;
    } else {
      ppos = { ...mouse };
    }

    const sr = scrub.getBoundingClientRect();
    if (sr.bottom > 0 && sr.top < innerHeight) {
      const p = reduced ? 1 : clamp((innerHeight * 0.85 - sr.top) / (sr.height + innerHeight * 0.3));
      const lit = Math.round(p * scrubWords.length * 1.1);
      scrubWords.forEach((w, i) => w.classList.toggle("lit", i < lit));
    }

    for (const d of Dither.all) d.tick(now);
  }
  requestAnimationFrame(frame);

  // Deep link straight to a project.
  const start = location.hash.slice(1);
  if (PROJECTS.some((p) => p.slug === start)) open(start);
})();
