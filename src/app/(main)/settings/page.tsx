"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
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
  DownloadIcon,
  Trash2Icon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LifeBuoyIcon,
  DatabaseIcon,
} from "lucide-react";

interface Preferences {
  units: "metric" | "imperial";
  defaultRadiusKm: number;
  notifyOnDispatch: boolean;
  notifyOnArrival: boolean;
  autoShareVitals: boolean;
  highContrast: boolean;
  // Storage & Analytics Preferences
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
    <label
      className={`flex items-start justify-between gap-4 py-3 ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
      />
    </label>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sos-healthcare-personal-data-${new Date().toISOString().split("T")[0]}.json`;
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

      toast("Your account and associated profile records have been deleted.", "success");
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your account security, health sharing preferences, notifications, and personal data.
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircleIcon className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>

      {/* 1. Account & Security */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                1. Account &amp; Security
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Authentication credentials and active user session identity.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 uppercase tracking-wider">
              {profile?.role ?? "patient"}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Signed in Email</dt>
              <dd className="font-semibold text-gray-900 dark:text-white mt-0.5 break-all">
                {user?.email || "Not signed in"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Account ID</dt>
              <dd className="font-mono text-gray-700 dark:text-gray-300 mt-0.5 truncate">
                {user?.id || "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Password Update Form */}
        <div className="p-5">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">
            Change or Set Account Password
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Allows password-based authentication alongside email verification and OAuth. Minimum 8 characters.
          </p>
          <form onSubmit={handlePasswordUpdate} className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
            <input
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new secure password"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
        </div>

        {/* Sign Out Row */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sign Out</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              End your active session on this browser.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="h-3.5 w-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </section>

      {/* 2. Privacy & Health Sharing */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            2. Privacy &amp; Health Sharing
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Control personal health metric visibility and medical data broadcast options.
          </p>

          <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle
              label="Share wearable vitals during emergency contact alert"
              description="Default: OFF. When enabled, your latest measured heart rate and steps are included in the SMS broadcast sent to your registered emergency contacts."
              checked={prefs.autoShareVitals}
              onChange={(v) => update("autoShareVitals", v)}
            />

            <Toggle
              label="Strictly Essential Cookies (Always Active)"
              description="Required for authentication, session tokens, and basic security navigation. Cannot be disabled."
              checked={true}
              disabled={true}
              onChange={() => {}}
            />

            <Toggle
              label="Optional Anonymous Performance & Analytics"
              description="Default: OFF. Anonymous telemetry to verify reliability. Never shares clinical vitals or private records."
              checked={prefs.analyticsCookies}
              onChange={(v) => update("analyticsCookies", v)}
            />

            <Toggle
              label="Optional Interface Personalization"
              description="Default: OFF. Saves display units and localized layout choices on this device."
              checked={prefs.personalizationCookies}
              onChange={(v) => update("personalizationCookies", v)}
            />
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Medical information recorded in your{" "}
            <Link href="/profile" className="text-blue-600 dark:text-blue-400 underline font-medium">
              Health Profile
            </Link>{" "}
            (allergies, blood type, conditions) is encrypted and kept within SOS Healthcare. We do not sell data to advertisers or third-party marketing brokers.
          </div>
        </div>
      </section>

      {/* 3. Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          3. Notifications
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          Configure real-time alerts and appointment planning notifications.
        </p>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
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

      {/* 4. Display & Language */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GlobeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          4. Display &amp; Language
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-4">
          Customize language across 25 supported locales, map distance units, and readability settings.
        </p>

        <div className="space-y-4">
          {/* Language Selector Integration */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Application Language (25 Supported Locales)
            </label>
            <LanguageSelector className="w-full sm:w-80" />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Distance Units
            </label>
            <select
              value={prefs.units}
              onChange={(e) => update("units", e.target.value as Preferences["units"])}
              className="w-full sm:w-56 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="metric">Kilometres (km)</option>
              <option value="imperial">Miles (mi)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Default Hospital Search Radius
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {prefs.defaultRadiusKm} km
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={prefs.defaultRadiusKm}
              onChange={(e) => update("defaultRadiusKm", Number(e.target.value))}
              className="w-full sm:w-72 accent-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Toggle
              label="High Contrast Mode"
              description="Enhance element borders and contrast for high-glare environments."
              checked={prefs.highContrast}
              onChange={(v) => update("highContrast", v)}
            />
          </div>
        </div>
      </section>

      {/* 5. My Personal Data */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DatabaseIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          5. My Personal Data
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
          Download an authorized copy of all records associated with your account under GDPR / CCPA right of access.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Your export archive includes your authenticated profile details, registered emergency contacts, appointment planning submissions, emergency guidance logs, and device sync metadata in standard JSON format.
          </p>

          <Button
            variant="outline"
            size="sm"
            loading={exportLoading}
            onClick={handleExportData}
            className="flex items-center gap-1.5"
          >
            <DownloadIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Download My Personal Data</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">
              (Export My Data Archive)
            </span>
          </Button>
        </div>
      </section>

      {/* 6. Legal & Support */}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            6. Legal &amp; Support
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Healthcare compliance documents, platform policies, and contact information.
          </p>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/privacy-policy"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-xs font-medium text-gray-800 dark:text-gray-200"
          >
            <span>Privacy Policy</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400" />
          </Link>

          <Link
            href="/terms-of-service"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-xs font-medium text-gray-800 dark:text-gray-200"
          >
            <span>Terms of Service</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400" />
          </Link>

          <Link
            href="/contact"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all text-xs font-medium text-gray-800 dark:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <LifeBuoyIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Contact &amp; Support
            </span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        </div>
      </section>

      {/* 7. Account Actions */}
      <section className="bg-red-50/30 dark:bg-red-950/10 rounded-xl shadow-xs border border-red-200 dark:border-red-900/60 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2Icon className="h-4 w-4" />
              7. Account Actions
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
              Permanently delete your profile and account information. This action clears saved appointment requests, emergency contacts, and personal health metrics.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="shrink-0"
          >
            Request Account Deletion
          </Button>
        </div>
      </section>

      {/* Account Deletion Modal */}
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
