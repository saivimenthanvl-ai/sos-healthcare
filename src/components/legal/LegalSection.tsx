import type { ReactNode } from "react";

interface LegalSectionProps {
  id: string;
  number: number;
  heading: string;
  children: ReactNode;
}

export function LegalSection({ id, number, heading, children }: LegalSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 space-y-3">
      <h2
        id={`${id}-heading`}
        className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"
      >
        {number}. {heading}
      </h2>
      <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium">
        {children}
      </div>
    </section>
  );
}
