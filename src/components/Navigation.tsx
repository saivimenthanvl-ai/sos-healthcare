"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  AmbulanceIcon,
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
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

const patientNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Emergency", href: "/emergency", icon: MapIcon },
  { name: "Hospitals", href: "/hospitals", icon: HospitalIcon },
  { name: "Appointments", href: "/appointments", icon: CalendarIcon },
  { name: "Health", href: "/profile/health", icon: HeartIcon },
  { name: "Devices", href: "/devices", icon: SmartphoneIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

const doctorNavItems: NavItem[] = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: HomeIcon },
  { name: "Appointments", href: "/appointments", icon: CalendarIcon },
  { name: "Availability", href: "/doctor/dashboard", icon: ClockIcon || HomeIcon },
  { name: "Profile", href: "/doctor/profile", icon: UserIcon },
];

const emergencyStaffNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Dispatch", href: "/dispatch", icon: RadioIcon },
  { name: "Emergency", href: "/emergency", icon: MapIcon },
  { name: "Hospitals", href: "/hospitals", icon: HospitalIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

const adminNavItems: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
  { name: "Users", href: "/admin/dashboard", icon: UsersIcon },
  { name: "Hospitals", href: "/hospitals", icon: HospitalIcon },
  { name: "Appointments", href: "/appointments", icon: CalendarIcon },
  { name: "Dispatch", href: "/dispatch", icon: RadioIcon },
  { name: "Profile", href: "/admin/profile", icon: ShieldCheckIcon },
];

export function Navigation() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  const role = String(profile?.role_v2 || profile?.role || "PATIENT").toUpperCase();
  const items =
    role === "DOCTOR"
      ? doctorNavItems
      : role === "ADMIN"
      ? adminNavItems
      : role === "DISPATCHER" || role === "PARAMEDIC"
      ? emergencyStaffNavItems
      : patientNavItems;

  // Close the menus when the route changes. Adjusting state during render is
  // the documented pattern for responding to a changed input value, and avoids
  // the cascading render an effect would cause.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDropdownOpen(false);
    setMobileOpen(false);
  }

  // Dismiss the account dropdown on an outside click or Escape.
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
    <>
      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Account menu"
          aria-expanded={dropdownOpen}
        >
          {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url || user.user_metadata.picture}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline text-sm font-semibold max-w-[10rem] truncate text-gray-800 dark:text-gray-200">
            {displayName}
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Signed in as</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              {profile?.role && profile.role !== "patient" && (
                <p className="text-xs capitalize text-blue-600 dark:text-blue-400 font-medium mt-0.5">{profile.role}</p>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <HomeIcon className="h-4 w-4 text-gray-500" />
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


      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-16 bg-white border-b border-gray-200 shadow-lg z-20">
          <nav className="px-4 py-2 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}