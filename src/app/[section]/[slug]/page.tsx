import MarkdownRenderer from "@/components/markdown-renderer";
import SlowBackground from "@/components/slow-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMarkDownContent } from "@/lib/content";
import fs from "fs";
import { Calendar, Radio } from "lucide-react";
import path from "path";
import { siGithub } from "simple-icons";

interface PageProps {
  params: Promise<{
    section: string;
    slug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src/content");

  try {
    // Check if content directory exists
    if (!fs.existsSync(contentDir)) {
      console.warn("Content directory not found at:", contentDir);
      return [];
    }

    const params: { section: string; slug: string }[] = [];

    // Get all section directories
    const sections = fs
      .readdirSync(contentDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Get all markdown files in each section
    for (const section of sections) {
      const sectionPath = path.join(contentDir, section);

      if (fs.existsSync(sectionPath)) {
        const files = fs
          .readdirSync(sectionPath)
          .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
          .map((file) => file.replace(/\.(md|mdx)$/, ""));

        for (const slug of files) {
          params.push({ section, slug });
        }
      }
    }

    return params;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function SectionPage({ params }: PageProps) {
  const { section, slug } = await params;
  const content = await getMarkDownContent(section, slug);

  return (
    <main className=" w-full flex justify-center items-center">
      <SlowBackground />
      <div className="w-4/5 bg-secondary-background my-4 p-3 retro-border">
        <div className="border-b-4 border-border pb-8 mb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-tight">
            {content.data.title}
          </h1>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 border-2 border-border bg-background rounded-base shadow-sm font-mono text-sm font-bold">
                <Calendar className="w-4 h-4" />
                <span>{content.data.date}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {content.data.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="neutral"
                    className="text-sm px-3 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {content.data.livedemo && (
                <Button asChild size="lg" className="font-bold">
                  <a
                    href={content.data.livedemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Radio className="w-5 h-5" />
                    LIVE DEMO
                  </a>
                </Button>
              )}
              {content.data.repolink && (
                <Button
                  asChild
                  variant="neutral"
                  size="lg"
                  className="font-bold"
                >
                  <a
                    href={content.data.repolink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      role="img"
                      aria-label="GitHub"
                    >
                      <path d={siGithub.path} />
                    </svg>
                    REPOSITORY
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
        <MarkdownRenderer content={content.content} />
      </div>
    </main>
  );
}
