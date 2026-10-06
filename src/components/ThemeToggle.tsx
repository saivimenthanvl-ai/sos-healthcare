"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { SunIcon, MoonIcon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-lg transition-colors border bg-gray-100 text-gray-700 border-gray-200 ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="inline-block w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-lg transition-colors border ${
        theme === "dark"
          ? "bg-gray-800 text-yellow-400 border-gray-700 hover:bg-gray-700"
          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
      } ${className}`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
