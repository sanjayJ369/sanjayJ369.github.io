import Clock from "@/modules/v2/components/clock";
import DitherImage from "@/modules/v2/components/dither-image";
import Gallery from "@/modules/v2/components/gallery";
import Marquee from "@/modules/v2/components/marquee";
import ScrubText from "@/modules/v2/components/scrub-text";
import Split from "@/modules/v2/components/split";
import WorkList from "@/modules/v2/components/work-list";
import { formatDate, getProjects } from "@/modules/v2/lib/projects";

const FEATURED = ["go-dbms", "webhook-tester", "brick-breaker", "langapp"];

const LINKS = [
  { label: "The blog", note: "Long-form logs", href: "https://blog.sanjayj.dev" },
  { label: "GitHub", note: "Source, mostly Go", href: "https://github.com/sanjayj369" },
  { label: "LinkedIn", note: "The formal channel", href: "https://linkedin.com/in/j-sanjay" },
  { label: "Résumé", note: "One page, PDF", href: "https://bit.ly/sanjay-j-resume" },
];

const BIO =
  "I'm Sanjay, a computer science engineer who learns by building the thing itself. I've written a database from its B-tree up, a webhook tester driven entirely by tests, a flashcard generator for language learning, and a handful of small games. Away from the keyboard I make 3D art and play chess, both of which reward patience in the same way good systems do.";

export default function V2Home() {
  const projects = getProjects();
  const featured = FEATURED.map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
  const first = projects[projects.length - 1];

  return (
    <main id="main">
      <section className="hero">
        <div className="hero-meta intro" style={{ "--d": "0.9s" } as React.CSSProperties}>
          <span>Logbook, Vol. II</span>
          <span>Entries: {String(projects.length).padStart(2, "0")}</span>
          <span>Kept since {first.year}</span>
          <span>Last entry: {formatDate(projects[0].date)}</span>
        </div>

        <div className="hero-grid">
          <h1 className="hero-title">
            <Split text="Sanjay J" />
          </h1>
          <figure className="hero-portrait intro" style={{ "--d": "0.6s" } as React.CSSProperties}>
            <div className="hero-portrait-frame" data-cursor="Lamp">
              <DitherImage src="/images/profile.png" alt="Portrait of Sanjay J" pixel={3} light />
            </div>
            <figcaption>
              <span>Fig. 1</span> The author, by lamplight. Move the lamp.
            </figcaption>
          </figure>
          <div className="hero-copy">
            <p className="hero-lede intro" style={{ "--d": "1.1s" } as React.CSSProperties}>
              I build things to find out how they work: databases from the disk up, small developer
              tools, and the occasional game.
            </p>
            <a href="#work" className="hero-cue intro" style={{ "--d": "1.3s" } as React.CSSProperties}>
              <span className="hero-cue-line" aria-hidden />
              Read the manifest
            </a>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Database internals",
          "B-trees",
          "Go",
          "TypeScript",
          "React",
          "Godot",
          "C#",
          "Docker",
          "Test-driven",
          "CI/CD",
          "3D art",
          "Chess",
        ]}
      />

      <section id="work" className="section">
        <div className="section-head">
          <span className="label" data-reveal>
            I. The manifest
          </span>
          <h2 className="display" data-reveal>
            Every entry, <em>in order</em> of departure.
          </h2>
          <span className="section-count" data-reveal>
            {String(projects.length).padStart(2, "0")} entries
          </span>
        </div>
        <WorkList projects={projects} />
      </section>

      <Gallery projects={featured} />

      <section id="log" className="section log">
        <span className="label" data-reveal>
          III. From the log
        </span>
        <ScrubText text={BIO} className="log-text" />
        <dl className="facts">
          {[
            ["Interests", "Storage engines, indexing, systems that explain themselves"],
            ["Toolbox", "Go, TypeScript, React, Godot, C#, Docker, GitHub Actions"],
            ["Latest dispatch", "A write-up on building my own Google File System"],
            ["Off hours", "3D art and chess"],
          ].map(([k, v], i) => (
            <div key={k} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="contact" className="section fin">
        <span className="label" data-reveal>
          IV. Correspondence
        </span>
        <ul className="fin-links">
          {LINKS.map((l, i) => (
            <li key={l.label} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" data-cursor="Visit">
                <span className="fin-label">
                  <span>{l.label}</span>
                  <span aria-hidden>{l.label}</span>
                </span>
                <span className="fin-note">{l.note}</span>
                <span className="fin-arrow" aria-hidden>
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="fin-end" data-reveal aria-hidden>
          <Split text="Fin." />
        </p>

        <footer className="footer">
          <span>
            Local time <Clock />
          </span>
          {/* Different root layout, so a full page load is intended. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Previous edition (v1) ↩</a>
          <a href="#main">Back to top ↑</a>
          <span>Set in EB Garamond &amp; IBM Plex Mono</span>
        </footer>
      </section>
    </main>
  );
}
