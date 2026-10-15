// Builds the static v2 site from src/v2 and the project markdown.
//
//   node scripts/build-v2.mjs                 -> public/v2/index.html (served at /v2/)
//                                             and public/v2/classic/index.html
//   node scripts/build-v2.mjs --preview <dir> [--page minimal|classic]
//                                             -> a self-contained copy with relative
//                                                asset paths, for previewing elsewhere
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const root = process.cwd();
const src = path.join(root, "src/v2");
const projectsDir = path.join(root, "src/content/projects");

// Each layout: source html, extra stylesheet, output path under public/v2.
const PAGES = {
  minimal: { html: "page.html", css: [], out: "index.html", v1: "/" },
  classic: { html: "classic.html", css: ["classic.css"], out: "classic/index.html", v1: "/" },
};
const pageArg = process.argv.indexOf("--page");
const previewIndex = process.argv.indexOf("--preview");
const previewDir = previewIndex > -1 ? path.resolve(process.argv[previewIndex + 1]) : null;
// In the real site assets live at the domain root; in a preview they sit beside the page.
const base = previewDir ? "" : "/";

// Frontmatter dates come in both "dd-mm-yyyy" and "yyyy-mm-dd".
function normaliseDate(raw = "1970-01-01") {
  const parts = raw.split("-");
  if (parts[0].length === 4) return raw;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const rebase = (s) => (s ? s.replace(/(["'(])\/(assets|images)\//g, `$1${base}$2/`) : s);

const projects = await Promise.all(
  readdirSync(projectsDir)
    .filter((f) => f.endsWith(".md"))
    .map(async (file) => {
      const { data, content } = matter(readFileSync(path.join(projectsDir, file), "utf8"));
      // The body repeats the title as its first heading; the page shows its own.
      const body = content.replace(/^\s*#\s+.*\n/, "");
      const rendered = await remark().use(remarkGfm).use(html, { sanitize: false }).process(body);
      const date = normaliseDate(data.date);
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title ?? file,
        description: data.description ?? "",
        date,
        tags: data.tags ?? [],
        image: data.image ? rebase(`"${data.image}`).slice(1) : null,
        repo: data.repolink ?? null,
        demo: data.livedemo ?? null,
        html: rebase(String(rendered)),
      };
    })
);
projects.sort((a, b) => b.date.localeCompare(a.date));

// Draft cards suggested from GitHub repositories; shown separately, marked as proposals.
const proposed = JSON.parse(readFileSync(path.join(src, "proposed.json"), "utf8"));
for (const p of proposed) {
  const rendered = await remark().use(remarkGfm).use(html, { sanitize: false }).process(p.body);
  const { body: _body, ...meta } = p;
  projects.push({ ...meta, image: null, demo: null, proposed: true, html: String(rendered) });
}

// "</" inside inline JSON would end the script element early.
const data = JSON.stringify(projects).replace(/<\//g, "<\\/");
const js = readFileSync(path.join(src, "app.js"), "utf8");

function fragment(page) {
  const css = ["style.css", ...page.css].map((f) => readFileSync(path.join(src, f), "utf8")).join("\n");
  const body = readFileSync(path.join(src, page.html), "utf8")
    .replaceAll("__BASE__", base)
    .replace("__V1_URL__", previewDir ? "https://sanjayj.dev/" : page.v1);
  return `${body.replace("/*__STYLE__*/", css)}
<script>window.__PROJECTS__ = ${data};</script>
<script>
${js}
</script>
`;
}

if (previewDir) {
  // The preview host supplies the document skeleton, so ship the fragment only.
  const page = PAGES[pageArg > -1 ? process.argv[pageArg + 1] : "minimal"];
  mkdirSync(previewDir, { recursive: true });
  writeFileSync(path.join(previewDir, "index.html"), fragment(page));
  for (const dir of ["assets", "images"]) {
    cpSync(path.join(root, "public", dir), path.join(previewDir, dir), { recursive: true });
  }
  console.log(`v2 preview written to ${previewDir}`);
} else {
  for (const page of Object.values(PAGES)) {
    const file = path.join(root, "public/v2", page.out);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(
      file,
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Sanjay J — databases, developer tools and small games.">
<link rel="icon" href="/images/profile.png">
</head>
<body>
${fragment(page)}</body>
</html>
`
    );
    console.log(`v2 written to ${path.relative(root, file)}`);
  }
}
