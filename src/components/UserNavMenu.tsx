"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  UserIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  ChevronDownIcon,
  SettingsIcon,
} from "lucide-react";

export function UserNavMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Dismiss on outside click or Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push("/");
  };

  // While checking Supabase session, show a neutral placeholder to prevent flicker
  if (loading) {
    return (
      <div className="h-9 w-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  // Not authenticated: Show "Get Started"
  if (!user) {
    return (
      <Link href="/auth/login">
        <Button variant="danger" size="sm">
          Get Started
        </Button>
      </Link>
    );
  }

  // Authenticated: Derived dynamic metadata
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors shadow-xs"
        aria-label="User account menu"
        aria-expanded={dropdownOpen}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold max-w-[9rem] sm:max-w-[12rem] truncate">
          {displayName}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Signed in as
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            {user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <LayoutDashboardIcon className="h-4 w-4 text-gray-500" />
            Dashboard
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <UserIcon className="h-4 w-4 text-gray-500" />
            Profile
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <SettingsIcon className="h-4 w-4 text-gray-500" />
            Account Settings
          </Link>

          <hr className="my-1 border-gray-100 dark:border-gray-800" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
