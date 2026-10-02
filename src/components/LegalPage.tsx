import type { ReactNode } from "react";
import Link from "next/link";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated {updated}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>

      <Link href="/" className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-1.5">{heading}</h2>
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">{children}</div>
    </section>
  );
}