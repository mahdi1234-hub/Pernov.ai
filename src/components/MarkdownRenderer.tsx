"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold text-white/90 mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-white/90 mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-medium text-white/85 mt-2 mb-1">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm font-light leading-relaxed text-white/80 mb-2">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-white/80 mb-2 space-y-1 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-white/80 mb-2 space-y-1 ml-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-white/80 leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white/95">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-white/75">{children}</em>
        ),
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-white/10 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-black/30 text-white/80 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 border border-white/10">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-black/30 rounded-lg overflow-x-auto my-2 border border-white/10">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-500/50 pl-4 my-2 text-white/70 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm text-white/80 border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-white/20 text-white/90">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-xs uppercase tracking-wider font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-white/5">{children}</td>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="border-white/10 my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
