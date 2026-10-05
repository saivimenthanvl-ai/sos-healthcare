"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetErr) {
        if (resetErr.message?.toLowerCase().includes("rate limit")) {
          setError(
            "Email rate limit reached. Please wait a few minutes before trying again."
          );
        } else {
          setError(resetErr.message);
        }
        return;
      }

      setMessage(
        "If an account is associated with this email, you will receive password reset instructions."
      );
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Reset your password
      </h2>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
        Enter your email to receive a password reset link.
      </p>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!email}
        >
          Send Reset Instructions
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
