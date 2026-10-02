import type { ReactNode } from "react";
import Link from "next/link";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">Last updated {updated}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-6 text-gray-700 leading-relaxed">
        {children}
      </div>

      <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{heading}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}