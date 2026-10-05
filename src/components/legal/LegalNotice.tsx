import type { ReactNode } from "react";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";

interface LegalNoticeProps {
  variant?: "warning" | "info";
  title?: string;
  children: ReactNode;
}

export function LegalNotice({ variant = "warning", title, children }: LegalNoticeProps) {
  const isWarning = variant === "warning";
  const Icon = isWarning ? AlertTriangleIcon : InfoIcon;

  return (
    <div
      role={isWarning ? "alert" : "note"}
      className={
        isWarning
          ? "flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4 text-red-900 dark:text-red-100"
          : "flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 p-4 text-blue-900 dark:text-blue-100"
      }
    >
      <Icon
        aria-hidden="true"
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isWarning ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}
      />
      <div className="text-sm sm:text-base leading-relaxed">
        {title && <p className="font-bold mb-1">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
