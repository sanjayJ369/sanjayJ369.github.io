import MarkdownRenderer from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMarkDownContent } from "@/lib/content";
import fs from "fs";
import { Radio } from "lucide-react";
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
      <div className="w-4/5 bg-secondary-background my-4 p-3 retro-border">
        <h1 className="text-2xl">{content.data.title}</h1>
        <ul>
          <li>created at: {content.data.date}</li>
          <li>
            tags:{" "}
            {content.data.tags.map((tag: string) => (
              <Badge key={tag} className="mx-1">
                {tag}
              </Badge>
            ))}
          </li>
          {content.data.livedemo && (
            <li>
              <Button asChild className="my-2">
                <a
                  href={content.data.livedemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Radio />
                  live demo
                </a>
              </Button>
            </li>
          )}
          {content.data.repolink && (
            <li>
              <Button asChild className="my-2">
                <a
                  href={content.data.repolink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    role="img"
                    aria-label="GitHub"
                  >
                    <path d={siGithub.path} />
                  </svg>
                  view repository
                </a>
              </Button>
            </li>
          )}
        </ul>
        <MarkdownRenderer content={content.content} />
      </div>
    </main>
  );
}
