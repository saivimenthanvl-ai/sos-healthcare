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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** When set, the link only appears for that role. */
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Emergency", href: "/emergency", icon: MapIcon },
  { name: "Hospitals", href: "/hospitals", icon: HospitalIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

const staffItems: NavItem[] = [
  {
    name: "Dispatch",
    href: "/dispatch",
    icon: RadioIcon,
    roles: ["dispatcher", "paramedic"],
  },
  {
    name: "Paramedic",
    href: "/paramedic",
    icon: AmbulanceIcon,
    roles: ["paramedic"],
  },
];

export function Navigation() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = [
    ...navItems,
    ...staffItems.filter((item) => item.roles?.includes(profile?.role ?? "")),
  ];

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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

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
          className="flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Account menu"
          aria-expanded={dropdownOpen}
        >
          {profile?.full_name ? (
            <span className="hidden sm:inline text-sm font-medium max-w-[10rem] truncate">
              {profile.full_name}
            </span>
          ) : null}
          <UserIcon className="h-5 w-5" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {profile?.full_name && (
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile.full_name}
                </p>
                {profile.role && profile.role !== "patient" && (
                  <p className="text-xs capitalize text-blue-600">{profile.role}</p>
                )}
              </div>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDropdownOpen(false)}
            >
              <UserIcon className="h-4 w-4" />
              Profile &amp; Health Data
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDropdownOpen(false)}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
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