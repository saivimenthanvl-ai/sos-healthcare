"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MailIcon, KeyRoundIcon, ArrowLeftIcon, CheckCircle2Icon } from "lucide-react";

function LoginForm() {
  const [authMode, setAuthMode] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpStep, setOtpStep] = useState<"enter-email" | "enter-code">("enter-email");
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithOtp, verifyOtp, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");
  const formattedUrlError =
    urlError === "google_login_failed" || urlError === "oauth_callback_failed"
      ? "We couldn't complete Google sign-in. Please try again."
      : urlError;
  const activeError = error || formattedUrlError;

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || cooldown > 0 || loading) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const { error: otpError } = await signInWithOtp(email.trim());
      if (otpError) {
        setError(otpError.message);
      } else {
        setOtpStep("enter-code");
        setCooldown(60);
        setSuccessMessage(t.auth.otpSentSuccess);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpToken.trim().replace(/\s+/g, "");
    if (!token || loading) return;

    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await verifyOtp(email.trim(), token);
      if (verifyError) {
        setError(t.auth.invalidOtp);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.invalidOtp);
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Sign In
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email.trim(), password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (
        (err instanceof Error && err.message.toLowerCase().includes("invalid login credentials")) ||
        (typeof err === "object" && err !== null && "code" in err && err.code === "invalid_credentials")
      ) {
        setError(
          "Invalid login credentials. If you previously registered using Google or OTP, please use those methods, or use 'Forgot password' below."
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error("Google authentication error:", err);
      if (
        (err instanceof Error && err.message.includes("provider is not enabled")) ||
        (typeof err === "object" && err !== null && "error_code" in err && err.error_code === "validation_failed")
      ) {
        setError(
          "Google sign-in is currently unavailable. Please try again or use another sign-in method."
        );
      }
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {authMode === "otp"
          ? otpStep === "enter-code"
            ? t.auth.enterOtpTitle
            : t.auth.emailOtpTitle
          : "Sign in to your account"}
      </h2>
      <p className="text-center text-xs text-gray-600 dark:text-gray-400 mb-6">
        {authMode === "otp"
          ? otpStep === "enter-code"
            ? t.auth.enterOtpSubtitle.replace("{email}", email)
            : t.auth.emailOtpSubtitle
          : "Sign in with your email and password"}
      </p>

      {urlMessage && !activeError && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
          {urlMessage}
        </div>
      )}

      {successMessage && !activeError && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {activeError}
        </div>
      )}

      {/* OTP Authentication Form */}
      {authMode === "otp" ? (
        otpStep === "enter-email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label={t.auth.emailLabel}
              type="email"
              placeholder={t.auth.emailPlaceholder}
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
              disabled={!email || loading || googleLoading}
              className="flex items-center justify-center gap-2"
            >
              <MailIcon className="h-4 w-4" />
              {loading ? t.auth.sendingOtp : t.auth.sendOtp}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label={t.auth.otpLabel}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder={t.auth.otpPlaceholder}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              required
              autoFocus
              className="text-center text-xl tracking-widest font-mono"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!otpToken || loading}
              className="flex items-center justify-center gap-2"
            >
              <KeyRoundIcon className="h-4 w-4" />
              {loading ? t.auth.verifying : t.auth.verifyOtp}
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setOtpStep("enter-email");
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                {t.auth.changeEmail}
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={cooldown > 0 || loading}
                className={
                  cooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                }
              >
                {cooldown > 0
                  ? t.auth.resendCooldown.replace("{seconds}", cooldown.toString())
                  : t.auth.resendCode}
              </button>
            </div>
          </form>
        )
      ) : (
        /* Password Authentication Form */
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label={t.auth.emailLabel}
            type="email"
            placeholder={t.auth.emailPlaceholder}
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

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!email || !password || googleLoading}
          >
            Sign In
          </Button>
        </form>
      )}

      {/* Switch between OTP and Password login */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setAuthMode((prev) => (prev === "otp" ? "password" : "otp"));
            setError("");
            setSuccessMessage("");
          }}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {authMode === "otp" ? t.auth.orPasswordLogin : t.auth.orOtpLogin}
        </button>
      </div>

      <div className="my-5 flex items-center">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
        <span className="px-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
          OR
        </span>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
      </div>

      {/* Google OAuth Alternative */}
      <Button
        variant="outline"
        fullWidth
        loading={googleLoading}
        disabled={googleLoading || loading}
        onClick={handleGoogle}
        type="button"
        className="dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <span className="flex items-center justify-center gap-3 text-xs font-medium">
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t.auth.googleSignIn}
        </span>
      </Button>

      <p className="mt-5 text-center text-xs text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
