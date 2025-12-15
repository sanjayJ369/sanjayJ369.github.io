// components/MarkdownRenderer.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Props = {
  content: string;
};

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="w-full max-w-none font-base text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="border-border border-4 shadow-shadow rounded-base align-middle m-auto my-8 max-w-full h-auto"
              alt={props.alt || ""}
            />
          ),
          iframe: ({ node, ...props }) => (
            <div className="my-8 aspect-video w-full max-w-4xl mx-auto border-border border-4 shadow-shadow rounded-base overflow-hidden bg-black">
              <iframe
                {...props}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ),
          h1: ({ node, ...props }) => (
            <h1
              {...props}
              className="text-4xl md:text-5xl font-heading font-black mt-12 mb-6 uppercase tracking-tight break-words text-neutral-900 dark:text-neutral-100"
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              {...props}
              className="text-3xl md:text-4xl font-heading font-bold mt-10 mb-5 border-b-4 border-border pb-2 break-words text-neutral-800 dark:text-neutral-200"
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              {...props}
              className="text-2xl md:text-3xl font-heading font-bold mt-8 mb-4 break-words text-neutral-800 dark:text-neutral-200"
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              {...props}
              className="text-xl md:text-2xl font-heading font-bold mt-6 mb-3 break-words text-neutral-700 dark:text-neutral-300"
            />
          ),
          h5: ({ node, ...props }) => (
            <h5
              {...props}
              className="text-lg md:text-xl font-heading font-bold mt-6 mb-3 break-words text-neutral-700 dark:text-neutral-300"
            />
          ),
          h6: ({ node, ...props }) => (
            <h6
              {...props}
              className="text-base md:text-lg font-heading font-bold mt-6 mb-3 uppercase break-words text-neutral-600 dark:text-neutral-400"
            />
          ),
          p: ({ node, ...props }) => (
            <p
              {...props}
              className="my-4 leading-relaxed text-lg text-neutral-700 dark:text-neutral-300"
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-8 border-main pl-6 py-4 my-8 bg-secondary-background italic text-xl font-medium shadow-sm text-neutral-800 dark:text-neutral-200"
            />
          ),
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-[#1e1e1e] text-[#d4d4d4] p-6 rounded-base border-4 border-border shadow-shadow my-8 overflow-x-auto text-sm md:text-base font-mono"
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            return isInline ? (
              <code
                {...props}
                className="bg-main/20 text-foreground px-1.5 py-0.5 rounded-sm font-mono text-sm font-bold border border-main/30"
              >
                {children}
              </code>
            ) : (
              <code {...props} className={`${className} block`}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-accent font-bold underline decoration-4 underline-offset-4 hover:text-main hover:decoration-main transition-all break-words"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              {...props}
              className="list-disc pl-10 my-4 space-y-2 marker:text-neutral-900 dark:marker:text-neutral-100 text-neutral-700 dark:text-neutral-300"
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              {...props}
              className="list-decimal pl-10 my-4 space-y-2 marker:text-neutral-900 dark:marker:text-neutral-100 font-bold text-neutral-700 dark:text-neutral-300"
            />
          ),
          li: ({ node, ...props }) => <li {...props} className="pl-2" />,
          hr: ({ node, ...props }) => (
            <hr
              {...props}
              className="my-12 border-t-4 border-border border-dashed"
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-8 border-4 border-border shadow-shadow rounded-base">
              <table {...props} className="w-full text-left border-collapse" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} className="bg-main text-main-foreground" />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} className="bg-background" />
          ),
          tr: ({ node, ...props }) => (
            <tr
              {...props}
              className="border-b-2 border-border last:border-0 hover:bg-secondary-background/50 transition-colors"
            />
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="p-4 font-heading font-bold text-lg border-r-2 border-border last:border-0"
            />
          ),
          td: ({ node, ...props }) => (
            <td
              {...props}
              className="p-4 border-r-2 border-border last:border-0"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
