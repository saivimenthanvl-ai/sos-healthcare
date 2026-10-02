"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  // In an emergency app the fallback must always offer the emergency route.
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-600">
          The page failed to load. If this happened while you were waiting for
          an ambulance, your emergency is still active and crews can see your
          location.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Reference: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={reset}>
            <RotateCwIcon className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Link href="/emergency">
            <Button variant="danger">Go to emergency page</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}