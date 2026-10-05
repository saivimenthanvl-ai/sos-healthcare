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
} from "lucide-react";

/**
 * Client-side preferences.
 *
 * These are deliberately local rather than server-backed: they are device
 * preferences, not account data, so there is nothing to sync across a user's
 * own devices yet.
 */
interface Preferences {
  units: "metric" | "imperial";
  defaultRadiusKm: number;
  notifyOnDispatch: boolean;
  notifyOnArrival: boolean;
  autoShareVitals: boolean;
  highContrast: boolean;
}

const STORAGE_KEY = "sos-healthcare:preferences";

const DEFAULTS: Preferences = {
  units: "metric",
  defaultRadiusKm: 20,
  notifyOnDispatch: true,
  notifyOnArrival: true,
  autoShareVitals: true,
  highContrast: false,
};

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

// Defined at module scope: a component declared inside a component body is
// re-created on every render and remounts its subtree each time.
function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <span>
        <span className="block font-medium text-gray-900">{label}</span>
        <span className="block text-sm text-gray-600 mt-0.5">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
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
    } catch (err: any) {
      toast(err?.message || "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Preferences live in localStorage, so they cannot be read during the
  // server render. Hydrate after mount to avoid a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
      }
    } catch {
      // Corrupt or unavailable storage — fall back to defaults.
    }
  }, []);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Persistence is best-effort.
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

  const requestDelete = async () => {
    try {
      await navigator.clipboard.writeText(user?.email ?? "");
      toast("Your email copied. Contact support to delete your account.", "info");
    } catch {
      toast("Contact support to delete your account.", "info");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-gray-600" />
          Settings
        </h1>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>

      {/* Account */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Signed in as</dt>
            <dd className="font-medium text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Role</dt>
            <dd className="font-medium text-gray-900 capitalize">
              {profile?.role ?? "patient"}
            </dd>
          </div>
        </dl>

        <div className="flex gap-3 mt-5">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="h-4 w-4 mr-1" />
            Sign out
          </Button>
          <Button variant="ghost" size="sm" onClick={requestDelete}>
            Delete account
          </Button>
        </div>
      </section>

      {/* Security & Password */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-indigo-600" />
          Security &amp; Password
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Set or update your password to sign in using your email and password in addition to Google.
        </p>

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Notifications */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-blue-600" />
          Notifications
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          How you are told about the progress of your own emergency.
        </p>

        <div className="space-y-3">
          <Toggle
            label="Tell me when a crew is dispatched"
            description="Notify me as soon as an ambulance is assigned."
            checked={prefs.notifyOnDispatch}
            onChange={(v) => update("notifyOnDispatch", v)}
          />
          <Toggle
            label="Tell me when the ambulance arrives"
            description="Notify me the moment the crew marks themselves on scene."
            checked={prefs.notifyOnArrival}
            onChange={(v) => update("notifyOnArrival", v)}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-red-600" />
          Privacy
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Control what responders can see during an emergency.
        </p>

        <div className="space-y-3">
          <Toggle
            label="Share vitals with responding crews"
            description="Heart rate, steps and device location from a connected wearable."
            checked={prefs.autoShareVitals}
            onChange={(v) => update("autoShareVitals", v)}
          />
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Medical conditions, allergies and blood type from your{" "}
          <Link href="/profile" className="text-blue-600 hover:underline">
            profile
          </Link>{" "}
          are always shared with a crew responding to you. Turning this off only
          hides live wearable data.
        </p>
      </section>

      {/* Display */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-green-600" />
          Display &amp; Units
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distance units
            </label>
            <select
              value={prefs.units}
              onChange={(e) =>
                update("units", e.target.value as Preferences["units"])
              }
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="metric">Kilometres</option>
              <option value="imperial">Miles</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default hospital search radius: {prefs.defaultRadiusKm} km
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={prefs.defaultRadiusKm}
              onChange={(e) =>
                update("defaultRadiusKm", Number(e.target.value))
              }
              className="w-full sm:w-64 accent-blue-600"
            />
          </div>

          <Toggle
            label="High contrast"
            description="Increase contrast for outdoor readability."
            checked={prefs.highContrast}
            onChange={(v) => update("highContrast", v)}
          />
        </div>
      </section>
    </div>
  );
}