import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import DitherImage from "@/modules/v2/components/dither-image";
import Split from "@/modules/v2/components/split";
import TransitionLink from "@/modules/v2/components/transition-link";
import { formatDate, getProject, getProjects, pad } from "@/modules/v2/lib/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { meta } = getProject((await params).slug);
  return { title: `${meta.title} — Sanjay J`, description: meta.description };
}

export default async function WorkEntry({ params }: Props) {
  const { slug } = await params;
  const { meta, content, index, total, next } = getProject(slug);

  return (
    <main id="main" className="entry">
      <header className="entry-head">
        <div className="entry-crumbs intro" style={{ "--d": "0.2s" } as React.CSSProperties}>
          <TransitionLink href="/v2/" data-cursor="Back">
            ← The manifest
          </TransitionLink>
          <span>
            Entry No. {pad(index + 1)} / {pad(total)}
          </span>
        </div>
        <h1 className="entry-title">
          <Split text={meta.title} />
        </h1>
        <p className="entry-lede intro" style={{ "--d": "0.7s" } as React.CSSProperties}>
          {meta.description}
        </p>
        <dl className="entry-ledger intro" style={{ "--d": "0.85s" } as React.CSSProperties}>
          <div>
            <dt>Logged</dt>
            <dd>{formatDate(meta.date)}</dd>
          </div>
          <div>
            <dt>Cargo</dt>
            <dd>{meta.tags.join(", ")}</dd>
          </div>
          {meta.repolink && (
            <div>
              <dt>Source</dt>
              <dd>
                <a href={meta.repolink} target="_blank" rel="noopener noreferrer" className="ink-link">
                  Repository ↗
                </a>
              </dd>
            </div>
          )}
          {meta.livedemo && (
            <div>
              <dt>Live</dt>
              <dd>
                <a href={meta.livedemo} target="_blank" rel="noopener noreferrer" className="ink-link">
                  Try it ↗
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      {meta.image && (
        <figure className="entry-plate intro" style={{ "--d": "0.5s" } as React.CSSProperties}>
          <div className="entry-plate-frame">
            <DitherImage src={meta.image} alt={meta.title} pixel={2} />
          </div>
          <figcaption>
            <span>Plate {pad(index + 1)}</span> {meta.title}, rendered in two tones.
          </figcaption>
        </figure>
      )}

      <article className="prose" data-reveal>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ node: _node, ...props }) => (
              <a {...props} className="ink-link" target="_blank" rel="noopener noreferrer" />
            ),
            img: ({ node: _node, ...props }) => (
              <img {...props} alt={props.alt ?? ""} loading="lazy" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      <TransitionLink href={`/v2/work/${next.slug}/`} className="entry-next" data-cursor="Next">
        <span className="label">Next entry</span>
        <span className="entry-next-title">
          <span>{next.title}</span>
          <span aria-hidden>{next.title}</span>
        </span>
        {next.image && (
          <span className="entry-next-media">
            <DitherImage src={next.image} alt="" pixel={2} />
          </span>
        )}
      </TransitionLink>
    </main>
  );
}
