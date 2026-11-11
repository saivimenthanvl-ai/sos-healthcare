"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPatientName } from "@/lib/patient-name";
import { LanguageSelector } from "@/components/LanguageSelector";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  MapIcon,
  HospitalIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  RadioIcon,
  CalendarIcon,
  HeartIcon,
  SmartphoneIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClockIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
}

export function Navigation() {
  const { user, profile, signOut } = useAuth();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rawName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  const displayName = getLocalizedPatientName(rawName, language);

  const role = (profile?.role || "PATIENT").toUpperCase();

  // Task-focused primary navigation items (max 4 on desktop to avoid crowding)
  const primaryNavItems: NavItem[] =
    role === "DOCTOR"
      ? [
          { id: "dashboard", name: t.nav.dashboard, href: "/doctor/dashboard", icon: HomeIcon },
          { id: "appointments", name: t.nav.appointments, href: "/appointments", icon: CalendarIcon },
          { id: "availability", name: "Availability", href: "/doctor/dashboard", icon: ClockIcon },
        ]
      : role === "ADMIN" || role === "DISPATCHER" || role === "PARAMEDIC"
      ? [
          { id: "dashboard", name: t.nav.dashboard, href: "/admin/dashboard", icon: HomeIcon },
          { id: "dispatch", name: "Dispatch", href: "/dispatch", icon: RadioIcon },
          { id: "hospitals", name: t.nav.hospitals, href: "/hospitals", icon: HospitalIcon },
          { id: "users", name: "Users", href: "/admin/dashboard", icon: UsersIcon },
        ]
      : [
          { id: "dashboard", name: t.nav.dashboard, href: "/dashboard", icon: HomeIcon },
          { id: "emergency", name: t.nav.emergency, href: "/emergency", icon: MapIcon },
          { id: "hospitals", name: t.nav.hospitals, href: "/hospitals", icon: HospitalIcon },
          { id: "appointments", name: t.nav.appointments, href: "/appointments", icon: CalendarIcon },
        ];

  // Secondary items accessible in mobile menu and dropdown
  const secondaryNavItems: NavItem[] =
    role === "DOCTOR"
      ? [{ id: "profile", name: t.nav.profile, href: "/doctor/profile", icon: UserIcon }]
      : role === "ADMIN" || role === "DISPATCHER" || role === "PARAMEDIC"
      ? [
          { id: "appointments", name: t.nav.appointments, href: "/appointments", icon: CalendarIcon },
          { id: "profile", name: t.nav.profile, href: "/admin/profile", icon: ShieldCheckIcon },
        ]
      : [
          { id: "health", name: t.nav.health, href: "/profile/health", icon: HeartIcon },
          { id: "devices", name: t.nav.devices, href: "/devices", icon: SmartphoneIcon },
          { id: "profile", name: t.nav.profile, href: "/profile", icon: UserIcon },
        ];

  const allMobileItems = [...primaryNavItems, ...secondaryNavItems];

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDropdownOpen(false);
    setMobileOpen(false);
  }

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
    await signOut();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/") {
      return pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Desktop navigation - compact and restrained */}
      <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse" aria-label="Main Navigation">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
                isActive(item.href)
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Language Selector */}
      <LanguageSelector compact />

      {/* Mobile hamburger button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* User account dropdown */}
      {user && (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((open) => !open)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="User account menu"
            aria-expanded={dropdownOpen}
          >
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url || user.user_metadata.picture}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline-block text-xs font-semibold max-w-[8rem] xl:max-w-[12rem] truncate text-gray-800 dark:text-gray-200">
              {displayName}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                {user.email && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                )}
                {profile?.role && profile.role !== "patient" && (
                  <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mt-1">{profile.role}</p>
                )}
              </div>

              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <HomeIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                {t.nav.dashboard}
              </Link>

              <Link
                href="/profile/health"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <HeartIcon className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                {t.nav.health}
              </Link>

              <Link
                href="/devices"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <SmartphoneIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                {t.nav.devices}
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <UserIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                {t.nav.profile}
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <SettingsIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                {t.common.settings}
              </Link>

              <hr className="my-1 border-gray-100 dark:border-gray-800" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-semibold text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOutIcon className="h-3.5 w-3.5 shrink-0" />
                {t.common.signOut}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile slide-down navigation panel */}
      {mobileOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl z-40 animate-in slide-in-from-top-2 duration-150">
          <nav className="px-4 py-3 space-y-1">
            {allMobileItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
