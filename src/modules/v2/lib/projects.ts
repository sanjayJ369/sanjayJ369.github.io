import path from "node:path";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "fs";

const projectsPath = path.join(process.cwd(), "src/content/projects");

export interface Project {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  year: string;
  tags: string[];
  image?: string;
  repolink?: string;
  livedemo?: string;
}

// Frontmatter dates come in both "dd-mm-yyyy" and "yyyy-mm-dd".
function normaliseDate(raw?: string) {
  if (!raw) return "1970-01-01";
  const parts = raw.split("-");
  if (parts[0].length === 4) return raw;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function getProjects(): Project[] {
  return readdirSync(projectsPath)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data } = matter(readFileSync(path.join(projectsPath, file), "utf8"));
      const date = normaliseDate(data.date);
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title ?? file,
        description: data.description ?? "",
        date,
        year: date.slice(0, 4),
        tags: data.tags ?? [],
        image: data.image,
        repolink: data.repolink,
        livedemo: data.livedemo,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getProject(slug: string) {
  const { data, content } = matter(
    readFileSync(path.join(projectsPath, `${slug}.md`), "utf8")
  );
  const projects = getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  return {
    meta: projects[index],
    data,
    content,
    index,
    total: projects.length,
    next: projects[(index + 1) % projects.length],
  };
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const roman = (n: number) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n] ?? String(n);

export const pad = (n: number) => String(n).padStart(2, "0");
