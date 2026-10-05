"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpIcon } from "lucide-react";

export interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  toc?: LegalTocItem[];
  children: ReactNode;
}

export function LegalLayout({ title, subtitle, lastUpdated, toc, children }: LegalLayoutProps) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: {lastUpdated}</p>
        )}
      </header>

      {toc && toc.length > 0 && (
        <nav
          aria-label="Table of contents"
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5"
        >
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-3">
            Contents
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-decimal pl-5 marker:text-gray-400">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="space-y-10 [overflow-wrap:anywhere]">{children}</div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
          Back to top
        </button>
      )}
    </div>
  );
}
