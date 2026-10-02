"use client";

import { useEffect, useState } from "react";
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple event system for toasts (no external deps)
type ToastListener = (toast: Omit<Toast, "id">) => void;
let toastListeners: ToastListener[] = [];
let toastIdCounter = 0;

export function toast(message: string, type: ToastType = "info") {
  toastListeners.forEach((listener) => listener({ message, type }));
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: ToastListener = (toastData) => {
      const id = `toast-${toastIdCounter++}`;
      const newToast = { id, ...toastData };
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    toastListeners.push(listener);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, removeToast };
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  error: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
  info: <InfoIcon className="h-5 w-5 text-blue-500" />,
  warning: <AlertCircleIcon className="h-5 w-5 text-yellow-500" />,
};

const toastBg: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
  warning: "bg-yellow-50 border-yellow-200",
};

export function Toaster() {
  const { toasts, removeToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm ${toastBg[t.type]}`}
        >
          {toastIcons[t.type]}
          <span className="text-sm text-gray-900">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
