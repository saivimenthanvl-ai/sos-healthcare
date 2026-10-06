"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheckIcon } from "lucide-react";

export default function AdminProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
          Administrator Account Profile
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Operational permissions, platform governance, and audit authorizations.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Administrator</label>
            <p className="font-bold text-gray-900 dark:text-white mt-0.5">{profile?.full_name || "System Admin"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Operational Role</label>
            <p className="font-bold text-purple-600 mt-0.5">ADMINISTRATOR</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Authorized Email</label>
            <p className="font-mono text-gray-700 dark:text-gray-300 mt-0.5">{profile?.email || "admin@soshealthcare.org"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Account Status</label>
            <p className="font-semibold text-emerald-600 mt-0.5">Active & Supervised</p>
          </div>
        </div>
      </div>
    </div>
  );
}
