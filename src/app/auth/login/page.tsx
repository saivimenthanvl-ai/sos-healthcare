"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!email || !password}
        >
          Sign In
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <Button
        variant="outline"
        fullWidth
        loading={googleLoading}
        onClick={handleGoogle}
        type="button"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 11.25h-2.08V11.25c0-.62-.01-1.25-.03-1.87 0-.15-.01-.29-.01-.44 0-.15 0-.29.01-.44.02-.62.03-1.25.03-1.87V6.75h4.19c3.31 0 5.36 2.05 5.36 4.56v3.89c0 2.45-2.05 4.56-4.56 4.56-.65 0-1.28-.06-1.87-.17a33.48 0 01-.17 1.14h2.08c2.46 0 4.56-2.14 4.56-4.75v-3.89c0-2.61-2.1-4.75-4.71-4.75h-2.08v.01c0 .62.01 1.25.01 1.87v3.89c0 2.45-2.05 4.56-4.56 4.56z"
            />
            <path
              fill="currentColor"
              d="M12 5.25c.95 0 1.87.18 2.72.51a.75.75 0 00.93-.93C13.62 3.54 11.88 3.25 10.24 3.75c-.04.14-.1.28-.14.42A7.5 7.5 0 0112 5.25z"
            />
          </svg>
          Sign in with Google
        </span>
      </Button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
