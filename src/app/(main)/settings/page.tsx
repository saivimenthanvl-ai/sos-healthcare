"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { supabase } from "@/lib/supabase";
import {
  SettingsIcon,
  BellIcon,
  GlobeIcon,
  ShieldIcon,
  LogOutIcon,
  CheckCircleIcon,
  KeyIcon,
  CookieIcon,
  DownloadIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from "lucide-react";

interface Preferences {
  units: "metric" | "imperial";
  defaultRadiusKm: number;
  notifyOnDispatch: boolean;
  notifyOnArrival: boolean;
  autoShareVitals: boolean;
  highContrast: boolean;
  // Privacy & Cookies
  essentialCookies: boolean;
  analyticsCookies: boolean;
  personalizationCookies: boolean;
}

const STORAGE_KEY = "sos-healthcare:preferences";

const DEFAULTS: Preferences = {
  units: "metric",
  defaultRadiusKm: 20,
  notifyOnDispatch: false,
  notifyOnArrival: false,
  autoShareVitals: false, // Default OFF for privacy
  highContrast: false,
  essentialCookies: true,
  analyticsCookies: false, // Default OFF
  personalizationCookies: false, // Default OFF
};

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, checked, disabled = false, onChange }: ToggleProps) {
  return (
    <label className={`flex items-start justify-between gap-4 py-2 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Password updated successfully! You can now sign in with this password.", "success");
        setNewPassword("");
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
      }
    } catch {
      // Fall back to defaults
    }
  }, []);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Local persistence
      }
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/auth/export-data", { method: "POST" });
      if (!res.ok) throw new Error("Export request failed");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sos-healthcare-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Personal data archive downloaded successfully.", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to export data", "error");
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "DELETE_MY_ACCOUNT") {
      toast("Please type DELETE_MY_ACCOUNT exactly to confirm deletion.", "error");
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");

      toast("Your account has been deleted.", "success");
      setDeleteModalOpen(false);
      await signOut();
      router.push("/");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to delete account", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          Settings
        </h1>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>

      {/* 1. Account */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Account Information</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Signed in as</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">User Role</dt>
            <dd className="font-medium text-gray-900 dark:text-white capitalize">
              {profile?.role ?? "patient"}
            </dd>
          </div>
        </dl>

        <div className="flex gap-3 mt-5">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </div>
      </section>

      {/* 2. Security */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          2. Security &amp; Password
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Set or update your password to sign in using email OTP or password in addition to Google OAuth.
        </p>

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New password
            </label>
            <input
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={passwordLoading}
            disabled={!newPassword || newPassword.length < 8}
          >
            Update Password
          </Button>
        </form>
      </section>

      {/* 3. Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          3. Notifications
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure how you receive updates regarding emergency alerts and custom appointment planning.
        </p>

        <div className="space-y-3">
          <Toggle
            label="Emergency contact alert confirmation"
            description="Receive an in-app confirmation whenever an SMS alert is transmitted to your registered emergency contacts."
            checked={prefs.notifyOnDispatch}
            onChange={(v) => update("notifyOnDispatch", v)}
          />
          <Toggle
            label="Appointment planning reminders"
            description="Show account reminders for upcoming private appointment plans."
            checked={prefs.notifyOnArrival}
            onChange={(v) => update("notifyOnArrival", v)}
          />
        </div>
      </section>

      {/* 4. Privacy & Health Sharing */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          4. Privacy &amp; Health Sharing
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Control personal health metric visibility. By default, optional health sharing is OFF until you explicitly consent.
        </p>

        <div className="space-y-3">
          <Toggle
            label="Include live wearable vitals in emergency contact broadcast"
            description="Optionally include heart rate and step metrics from connected devices when transmitting GPS coordinates to your registered emergency contacts."
            checked={prefs.autoShareVitals}
            onChange={(v) => update("autoShareVitals", v)}
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
          Your personal health conditions, allergies, and blood type recorded in your{" "}
          <Link href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
            profile
          </Link>{" "}
          are kept secure within your SOS Healthcare account. They are not transmitted to third-party hospital databases or public directories.
        </p>
      </section>

      {/* 5. Cookies & Tracking Preferences */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <CookieIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          5. Cookies &amp; Tracking Preferences
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manage how cookies and browser storage are utilized on this device.
        </p>

        <div className="space-y-3 divide-y divide-gray-100 dark:divide-gray-800">
          <Toggle
            label="Strictly Essential Cookies (Always Active)"
            description="Required for authentication, security tokens, and basic application navigation. Cannot be disabled."
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <Toggle
            label="Optional Anonymous Performance & Analytics"
            description="Anonymous usage statistics to help improve application reliability. Default: OFF. Never captures clinical or appointment data."
            checked={prefs.analyticsCookies}
            onChange={(v) => update("analyticsCookies", v)}
          />
          <Toggle
            label="Optional Interface Personalization"
            description="Remembers display preferences and localized layout options on this browser. Default: OFF."
            checked={prefs.personalizationCookies}
            onChange={(v) => update("personalizationCookies", v)}
          />
        </div>
      </section>

      {/* 6. Data Export & Account Deletion */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <DownloadIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          6. Personal Data &amp; Account Control
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Exercise your privacy rights under GDPR, CCPA, and applicable healthcare data protection standards.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            loading={exportLoading}
            onClick={handleExportData}
            className="flex items-center gap-1.5"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export My Data Archive (JSON)</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Trash2Icon className="h-4 w-4" />
            <span>Delete Account &amp; Data</span>
          </Button>
        </div>
      </section>

      {/* 7. Display & Units */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          7. Display &amp; Units
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Distance units
            </label>
            <select
              value={prefs.units}
              onChange={(e) => update("units", e.target.value as Preferences["units"])}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="metric">Kilometres</option>
              <option value="imperial">Miles</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default hospital search radius: {prefs.defaultRadiusKm} km
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={prefs.defaultRadiusKm}
              onChange={(e) => update("defaultRadiusKm", Number(e.target.value))}
              className="w-full sm:w-64 accent-blue-600"
            />
          </div>

          <Toggle
            label="High contrast mode"
            description="Enhance contrast for emergency legibility in bright sunlight."
            checked={prefs.highContrast}
            onChange={(v) => update("highContrast", v)}
          />
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangleIcon className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Permanently Delete Account?</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              This action permanently clears your profile, saved private appointment planning requests, emergency contacts, and device connections from SOS Healthcare.
              Past immutable security and administrative inquiry logs are retained for fraud prevention in accordance with our data retention policy.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="font-mono text-red-600 dark:text-red-400">DELETE_MY_ACCOUNT</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE_MY_ACCOUNT"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteLoading}
                disabled={deleteConfirmText !== "DELETE_MY_ACCOUNT"}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
