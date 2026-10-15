(() => {
  "use strict";

  const PROJECTS = window.__PROJECTS__ || [];
  const FEATURED = ["go-dbms", "webhook-tester", "brick-breaker", "langapp"];
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ------------------------------------------------------------------
     Palettes. Each one drives both the dither and the page's tokens.
     ------------------------------------------------------------------ */
  const PALETTES = [
    { id: "wired", name: "WIRED", colours: ["#0b0710", "#2a0d1c", "#5a1030", "#e0284f", "#ff8fb1", "#efe4e1", "#6fd3ff", "#3a2a5e"] },
    { id: "navi", name: "NAVI", colours: ["#05070d", "#10224a", "#2e5fd6", "#7ad7ff", "#c9b8ff", "#eef0ff", "#ff4f9a", "#1a1030"] },
    { id: "phosphor", name: "PHOSPHOR", colours: ["#050a06", "#0c2a14", "#17602a", "#39ff6a", "#b8ffbf", "#ffb84a", "#5a3a10", "#d8ffd9"] },
    { id: "copland", name: "COPLAND", colours: ["#0e0a05", "#2e1d08", "#7a3e0c", "#ff9a1f", "#ffd27a", "#fff1d6", "#8fd0ff", "#3b4a6b"] },
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
    $("#palette-name").textContent = p.name;
    $("#palette-swatch").innerHTML = p.colours.map((c) => `<i style="background:${c}"></i>`).join("");
    Dither.all.forEach((d) => (d.dirty = true));
  }

  /* ------------------------------------------------------------------
     Colour ordered dithering: an 8x8 Bayer offset per channel, then the
     nearest palette colour. Images "develop" in from black, can carry a
     pointer-driven lamp, and glitch now and then.
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

    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { willReadFrequently: true });
      this.pixel = Number(canvas.dataset.pixel || opts.pixel || 2);
      this.lamp = canvas.hasAttribute("data-lamp");
      this.visible = false;
      this.progress = reduced ? 1 : 0;
      this.start = -1;
      this.light = { x: 0.5, y: 0.4, on: 0 };
      this.glitchUntil = 0;
      this.nextGlitch = performance.now() + 2500 + Math.random() * 5000;
      this.dirty = true;
      Dither.all.add(this);
      Dither.io.observe(canvas);
      new ResizeObserver(() => this.sample()).observe(canvas);
      if (canvas.dataset.src) this.load(canvas.dataset.src);
    }

    load(src, develop = true) {
      this.src = src;
      this.img = null;
      this.progress = reduced || !develop ? 1 : 0;
      this.start = -1;
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
      // Stretch levels per channel so flat screenshots still read.
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

    render(now) {
      const { w, h, src32, out32 } = this;
      if (!src32) return;
      const pal = paletteRGB, pn = pal.length;
      const packed = pal.map(([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
      const lit = this.lamp && this.light.on > 0.01;
      const lx = this.light.x * w, ly = this.light.y * h, rad = Math.max(w, h) * 0.42;
      const glitching = now < this.glitchUntil;
      const spread = 72;
      for (let y = 0; y < h; y++) {
        const p = this.progress >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(this.progress * 1.4 - (y / h) * 0.4));
        const bias = -230 * (1 - p);
        // Horizontal tearing while glitching.
        const shift = glitching && Math.random() < 0.12 ? ((Math.random() - 0.5) * w * 0.25) | 0 : 0;
        const by = (y & 7) << 3;
        for (let x = 0; x < w; x++) {
          const sx = Math.min(w - 1, Math.max(0, x + shift));
          const j = (y * w + sx) * 3;
          let add = bias + BAYER[by + (x & 7)] * spread;
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
          out32[y * w + x] = packed[glitching && Math.random() < 0.002 ? 3 : best];
        }
      }
      this.ctx.putImageData(this.out, 0, 0);
    }

    tick(now) {
      if (!this.visible || !this.src32) return;
      if (this.progress < 1) {
        if (this.start < 0) this.start = now;
        this.progress = Math.min(1, (now - this.start) / 1700);
        this.dirty = true;
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
      if (!reduced && now > this.nextGlitch) {
        this.glitchUntil = now + 160 + Math.random() * 200;
        this.nextGlitch = now + 4000 + Math.random() * 7000;
      }
      if (now < this.glitchUntil + 20) this.dirty = true;
      if (this.dirty) {
        this.dirty = false;
        this.render(now);
      }
    }
  }
  Dither.io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      for (const d of Dither.all) if (d.canvas === e.target) d.visible = e.isIntersecting;
    }
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
    velocity: 0,
    max: () => document.documentElement.scrollHeight - innerHeight,
    to(y, immediate = false) {
      this.target = clamp(y, 0, this.max());
      if (immediate || !this.enabled) {
        this.current = this.target;
        scrollTo(0, this.target);
        return;
      }
      this.run();
    },
    run() {
      if (this.running) return;
      this.running = true;
      const step = () => {
        this.current = lerp(this.current, this.target, 0.085);
        this.velocity = this.target - this.current;
        if (Math.abs(this.velocity) < 0.4) {
          this.current = this.target;
          this.velocity = 0;
          this.running = false;
        }
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
    addEventListener("scroll", () => {
      if (!scroller.running) scroller.target = scroller.current = scrollY;
    }, { passive: true });
  }
  const scrollToEl = (el) => scroller.to(el.getBoundingClientRect().top + scrollY);
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = id === "top" ? $("#top") : document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  });

  /* ------------------------------------------------------------------
     Text scramble
     ------------------------------------------------------------------ */
  const GLYPHS = "アイウエオカキクケコサシスセソ01#%&/<>_=+*";
  function scramble(el, text = el.dataset.final || el.textContent) {
    if (reduced) { el.textContent = text; return; }
    el.dataset.final = text;
    const start = performance.now(), dur = 380 + text.length * 18;
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
    const host = e.target.closest("[data-scramble], a, button");
    if (!host || host.contains(e.relatedTarget)) return;
    const el = host.matches("[data-scramble]") ? host : host.querySelector("[data-scramble]");
    // Only scramble leaf text, never elements holding other markup.
    if (el && el.children.length === 0) scramble(el);
  });

  /* ------------------------------------------------------------------
     Build content from data
     ------------------------------------------------------------------ */
  const year = (p) => p.date.slice(0, 4);
  const pid = (i) => pad(1000 + (PROJECTS.length - i) * 37, 4);

  $("#entries-meta").textContent = `ENTRIES ${pad(PROJECTS.length)}`;
  $("#proc-count").textContent = `${pad(PROJECTS.length)} RUNNING`;

  $("#proc-rows").innerHTML = PROJECTS.map((p, i) => `
    <button type="button" class="proc-row reveal" role="row" data-slug="${p.slug}" data-index="${i}" data-cursor="open" style="--delay:${i * 0.05}s">
      <span class="proc-pid" role="cell">${pid(i)}</span>
      <span class="proc-name" role="cell"><span data-scramble>${p.title}</span></span>
      <span class="proc-desc" role="cell">${p.description}</span>
      <span class="proc-tags" role="cell">${p.tags.slice(0, 3).join(" / ")}</span>
      <span class="proc-year" role="cell">${year(p)}</span>
    </button>`).join("");

  const featured = FEATURED.map((s) => PROJECTS.find((p) => p.slug === s)).filter(Boolean);
  $("#signal-track").insertAdjacentHTML("beforeend", featured.map((p, i) => `
    <button type="button" class="window signal-card" data-slug="${p.slug}" data-cursor="read">
      <span class="window-bar"><span>signal_${pad(i + 1)} :: ${p.slug}</span><span class="window-btns" aria-hidden="true"><i></i><i></i><i></i></span></span>
      <span class="window-body" style="display:block"><span style="display:block"><canvas class="dither" data-src="${p.image}" data-pixel="2" role="img" aria-label="${p.title}"></canvas></span></span>
      <span class="signal-meta"><span class="signal-title">${p.title}</span><span class="signal-desc">${p.description}</span></span>
    </button>`).join(""));

  const words = [
    ["DATABASE INTERNALS", "記憶"], ["B-TREES", ""], ["GO", "接続"], ["TYPESCRIPT", ""], ["REACT", ""],
    ["GODOT", "遊戯"], ["C#", ""], ["DOCKER", ""], ["TEST-DRIVEN", "検証"], ["CI/CD", ""], ["3D ART", "造形"], ["CHESS", "将棋"],
  ];
  const tickerRow = words.map(([w, j]) => `<span>${w}${j ? ` <span lang="ja">${j}</span>` : ""} ///</span>`).join("");
  $("#ticker").innerHTML = tickerRow + tickerRow;

  /* Peek window (cursor-follow preview) */
  const peek = $("#peek"), peekStrip = $("#peek-strip"), peekName = $("#peek-name");
  if (finePointer) {
    peekStrip.innerHTML = PROJECTS.map((p) => (p.image ? `<canvas class="dither" data-src="${p.image}" data-pixel="2" data-slug="${p.slug}"></canvas>` : "")).join("");
  }

  /* Scrub text */
  const scrub = $("#scrub");
  scrub.setAttribute("aria-label", scrub.textContent);
  scrub.innerHTML = scrub.textContent.split(" ").map((w) => `<span class="w" aria-hidden="true">${w} </span>`).join("");
  const scrubWords = $$(".w", scrub);

  /* Dithered canvases */
  applyPalette();
  $$("canvas.dither[data-src]").forEach((c) => new Dither(c));
  const plate = new Dither($("#entry-plate"));

  $("#palette-btn").addEventListener("click", () => {
    paletteIndex = (paletteIndex + 1) % PALETTES.length;
    store.set("v2-dither", PALETTES[paletteIndex].id);
    applyPalette();
  });

  /* ------------------------------------------------------------------
     Entry window
     ------------------------------------------------------------------ */
  const entry = $("#entry");
  let lastFocus = null;

  function fillEntry(slug) {
    const i = PROJECTS.findIndex((p) => p.slug === slug);
    const p = PROJECTS[i];
    if (!p) return false;
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    $("#entry-file").textContent = `${slug}.md — pid ${pid(i)}`;
    $("#entry-pid").textContent = `PROCESS ${pad(i + 1)} OF ${pad(PROJECTS.length)} · PID ${pid(i)}`;
    const title = $("#entry-title");
    title.textContent = p.title;
    title.dataset.text = p.title;
    $("#entry-lede").textContent = p.description;
    const [y, m, d] = p.date.split("-");
    $("#entry-meta").innerHTML = `
      <div><dt>LOGGED</dt><dd>${y}.${m}.${d}</dd></div>
      <div><dt>TAGS</dt><dd>${p.tags.join(", ")}</dd></div>
      ${p.repo ? `<div><dt>SOURCE</dt><dd><a href="${p.repo}" target="_blank" rel="noopener noreferrer">repository ↗</a></dd></div>` : ""}
      ${p.demo ? `<div><dt>LIVE</dt><dd><a href="${p.demo}" target="_blank" rel="noopener noreferrer">try it ↗</a></dd></div>` : ""}`;
    const plateEl = $(".entry-plate");
    plateEl.hidden = !p.image;
    if (p.image) {
      plate.canvas.setAttribute("aria-label", p.title);
      plate.load(p.image);
    }
    const body = $("#entry-body");
    body.innerHTML = p.html;
    $$("a", body).forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    $$("img", body).forEach((img) => { img.loading = "lazy"; img.alt = img.alt || ""; });
    $("#entry-next-title").textContent = `${next.title} →`;
    $("#entry-next").dataset.slug = next.slug;
    $("#entry-scroll").scrollTop = 0;
    return true;
  }

  // Keep the address in sync so an entry can be linked to; no extra history entries.
  function setHash(hash) {
    try { history.replaceState(null, "", hash || location.pathname + location.search); } catch { /* sandboxed */ }
  }

  function openEntry(slug, push = true) {
    if (!fillEntry(slug)) return;
    if (entry.hidden) {
      lastFocus = document.activeElement;
      entry.hidden = false;
      scroller.locked = true;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => entry.classList.add("open")));
      $(".entry-close").focus({ preventScroll: true });
    }
    glitchOnce($("#entry-title"));
    if (push) setHash(`#entry-${slug}`);
  }

  function closeEntry(pop = false) {
    if (entry.hidden) return;
    entry.classList.remove("open");
    scroller.locked = false;
    document.body.style.overflow = "";
    setTimeout(() => { if (!entry.classList.contains("open")) entry.hidden = true; }, reduced ? 0 : 650);
    $$("video", entry).forEach((v) => v.pause());
    if (!pop && location.hash.startsWith("#entry-")) setHash("");
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-slug]:not(canvas)");
    if (trigger) { openEntry(trigger.dataset.slug); return; }
    if (e.target.closest("[data-close]")) closeEntry();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEntry();
    if (e.key === "Tab" && !entry.hidden) {
      // Keep focus inside the open window.
      const f = $$('button, a[href], video[controls], [tabindex]:not([tabindex="-1"])', entry).filter((el) => el.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener("hashchange", () => {
    const slug = location.hash.startsWith("#entry-") ? location.hash.slice(7) : null;
    if (slug) openEntry(slug, false);
    else closeEntry(true);
  });

  /* ------------------------------------------------------------------
     Glitch type
     ------------------------------------------------------------------ */
  function glitchOnce(el) {
    if (reduced || !el) return;
    el.classList.remove("is-glitching");
    void el.offsetWidth;
    el.classList.add("is-glitching");
    setTimeout(() => el.classList.remove("is-glitching"), 460);
  }
  if (!reduced) {
    (function loop() {
      const visible = $$(".glitch").filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && el.offsetParent;
      });
      if (visible.length) glitchOnce(visible[(Math.random() * visible.length) | 0]);
      setTimeout(loop, 2600 + Math.random() * 3800);
    })();
  }

  /* ------------------------------------------------------------------
     Layer indicator
     ------------------------------------------------------------------ */
  const layerNo = $("#layer-no"), layerName = $("#layer-name");
  const layerIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const no = `LAYER:${e.target.dataset.layer}`;
      if (layerNo.dataset.final === no) continue;
      scramble(layerNo, no);
      scramble(layerName, e.target.dataset.name);
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-layer]").forEach((s) => layerIO.observe(s));

  /* ------------------------------------------------------------------
     Reveal: only for content that starts below the fold, so the first
     frame is always complete.
     ------------------------------------------------------------------ */
  if (!reduced) {
    const candidates = $$(".reveal, .section-head, .facts > div, .links li, .scrub, .signal-head, .sign-off");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("revealing");
        e.target.classList.remove("pending");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -6% 0px" });
    candidates.forEach((el, i) => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add("pending");
        if (!el.style.getPropertyValue("--delay")) el.style.setProperty("--delay", `${(i % 4) * 0.06}s`);
        io.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------
     Clock
     ------------------------------------------------------------------ */
  const fmtTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });
  const fmtDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata" });
  const tickClock = () => {
    const now = new Date();
    $("#clock").textContent = fmtTime.format(now);
    $("#today").textContent = fmtDate.format(now).replaceAll("-", ".");
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ------------------------------------------------------------------
     Cursor
     ------------------------------------------------------------------ */
  const cursor = $("#cursor"), cursorLabel = $("#cursor-label");
  const cx = $(".cursor-x", cursor), cy = $(".cursor-y", cursor);
  let mouse = { x: -100, y: -100 }, cpos = { x: -100, y: -100 };
  addEventListener("pointermove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    Dither.pointer = mouse;
    const host = e.target.closest("[data-cursor]");
    const label = host ? host.dataset.cursor : "";
    if (cursorLabel.textContent !== label) cursorLabel.textContent = label;
  }, { passive: true });
  if (finePointer && !reduced) root.classList.add("has-cursor");

  /* ------------------------------------------------------------------
     Frame loop: ticker, peek window, pinned gallery, scrub, dithers.
     ------------------------------------------------------------------ */
  const ticker = $("#ticker");
  const signal = $("#signal"), track = $("#signal-track"), bar = $("#signal-bar");
  const wide = matchMedia("(min-width: 821px)");
  let tickX = 0, tickV = 0, tickSkew = 0, tickDir = 1;
  let peekPos = { x: 0, y: 0 }, peekActive = -1, signalShown = 0;

  const sizeSignal = () => {
    signal.style.height = wide.matches && !reduced ? `${track.scrollWidth - innerWidth + innerHeight}px` : "";
  };
  new ResizeObserver(sizeSignal).observe(track);
  wide.addEventListener("change", sizeSignal);

  const rows = $$(".proc-row");
  const peekCanvases = $$("canvas", peekStrip);
  rows.forEach((row) => {
    row.addEventListener("pointerenter", () => {
      peekActive = Number(row.dataset.index);
      const slug = row.dataset.slug;
      peekCanvases.forEach((c) => c.classList.toggle("on", c.dataset.slug === slug));
      peekName.textContent = `preview :: ${slug}.png`;
      peek.classList.toggle("on", peekCanvases.some((c) => c.dataset.slug === slug));
    });
  });
  $("#proc-rows").addEventListener("pointerleave", () => { peekActive = -1; peek.classList.remove("on"); });

  function frame(now) {
    requestAnimationFrame(frame);

    // Cursor
    cpos.x = lerp(cpos.x, mouse.x, 0.35);
    cpos.y = lerp(cpos.y, mouse.y, 0.35);
    cursor.style.transform = `translate3d(${cpos.x}px, ${cpos.y}px, 0)`;
    cx.textContent = `X:${pad(Math.round(mouse.x), 4)}`;
    cy.textContent = `Y:${pad(Math.round(mouse.y + scrollY), 5)}`;

    if (!reduced) {
      // Ticker leans and speeds with scroll velocity.
      const v = scroller.velocity || 0;
      if (Math.abs(v) > 1) tickDir = Math.sign(v);
      tickV = lerp(tickV, 0.6 * tickDir + v * 0.04, 0.08);
      tickSkew = lerp(tickSkew, clamp(v * 0.08, -10, 10), 0.1);
      const half = ticker.scrollWidth / 2;
      tickX -= tickV;
      if (tickX <= -half) tickX += half;
      if (tickX > 0) tickX -= half;
      ticker.style.transform = `translate3d(${tickX}px,0,0) skewX(${-tickSkew}deg)`;

      // Peek follows the pointer with a little lag.
      if (peekActive >= 0) {
        peekPos.x = lerp(peekPos.x, mouse.x, 0.14);
        peekPos.y = lerp(peekPos.y, mouse.y, 0.14);
        peek.style.transform = `translate3d(${peekPos.x}px, ${peekPos.y}px, 0)`;
      } else {
        peekPos = { ...mouse };
      }

      // Pinned horizontal gallery.
      if (wide.matches) {
        const r = signal.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        signalShown = lerp(signalShown, p, 0.12);
        track.style.transform = `translate3d(${-signalShown * (track.scrollWidth - innerWidth)}px,0,0)`;
        bar.style.transform = `scaleX(${signalShown})`;
        $$(".signal-card .window-body > span", track).forEach((m, i, all) => {
          const local = signalShown * (all.length - 1) - i;
          m.style.transform = `translate3d(${local * -5}%,0,0)`;
        });
      } else {
        track.style.transform = "";
      }
    }

    // Scrub text
    const sr = scrub.getBoundingClientRect();
    if (sr.bottom > 0 && sr.top < innerHeight) {
      const p = reduced ? 1 : clamp((innerHeight * 0.85 - sr.top) / (sr.height + innerHeight * 0.3));
      const lit = Math.round(p * scrubWords.length * 1.1);
      scrubWords.forEach((w, i) => {
        w.classList.toggle("lit", i < lit);
        w.classList.toggle("hot", i < lit && i >= lit - 3 && lit < scrubWords.length);
      });
    }

    for (const d of Dither.all) d.tick(now);
  }
  requestAnimationFrame(frame);

  /* ------------------------------------------------------------------
     Boot sequence
     ------------------------------------------------------------------ */
  const boot = $("#boot");
  const seen = store.get("v2-seen", sessionStorage);
  const startHash = location.hash;
  const afterBoot = () => {
    glitchOnce($(".hero h1"));
    if (startHash.startsWith("#entry-")) openEntry(startHash.slice(7), false);
  };
  if (seen || reduced || startHash.startsWith("#entry-")) {
    boot.classList.add("gone");
    afterBoot();
  } else {
    store.set("v2-seen", "1", sessionStorage);
    const lines = [
      "SJ-OS 2.0 · WIRED NODE 0369",
      "<span class=ok>[ OK ]</span> memory check .............. 640K",
      `<span class=ok>[ OK ]</span> mount /projects ........... ${PROJECTS.length} entries`,
      `<span class=ok>[ OK ]</span> calibrate dither .......... ${PALETTES[paletteIndex].colours.length} colours`,
      "<span class=ok>[ OK ]</span> handshake ................. you",
      "&gt; connecting to the wired_",
    ];
    const log = $("#boot-log"), fill = $("#boot-bar");
    let i = 0, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      fill.style.width = "100%";
      setTimeout(() => boot.classList.add("off"), 160);
      setTimeout(() => { boot.classList.add("gone"); afterBoot(); }, 1050);
    };
    const step = () => {
      if (done) return;
      log.innerHTML += (i ? "\n" : "") + lines[i];
      i++;
      fill.style.width = `${(i / lines.length) * 100}%`;
      if (i < lines.length) setTimeout(step, 150 + Math.random() * 160);
      else setTimeout(finish, 380);
    };
    step();
    boot.addEventListener("click", finish);
    addEventListener("keydown", finish, { once: true });
  }
})();
