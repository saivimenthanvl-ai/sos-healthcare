"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheckIcon, UsersIcon, ActivityIcon, HospitalIcon, CalendarIcon, AlertTriangleIcon } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          System Administration & Operations
        </h1>
        <p className="text-purple-200 text-sm max-w-2xl">
          Oversee platform health, user status, doctor verification, hospital telemetry integrations, and emergency operations.
        </p>
      </div>

      {/* Admin Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <UsersIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Registered Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Verified Doctors</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Accredited</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <HospitalIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Hospital Network</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Connected</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangleIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Active Emergencies</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Monitored</p>
        </div>
      </div>

      {/* Operational Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Operational Management</h2>
          <div className="space-y-3">
            <Link
              href="/dispatch"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Ambulance Fleet & Dispatch Console</span>
              <span className="text-xs text-blue-600 font-bold">Open Console →</span>
            </Link>
            <Link
              href="/hospitals"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Hospital Network Registry</span>
              <span className="text-xs text-blue-600 font-bold">Manage →</span>
            </Link>
            <Link
              href="/appointments"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">All Appointment Schedules</span>
              <span className="text-xs text-blue-600 font-bold">View →</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Audit Policies</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Administrative privileges provide operational oversight. Direct access to sensitive patient clinical charts is restricted by capability-based RLS and audited in <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">audit_logs</code>.
          </p>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs text-purple-900 dark:text-purple-200 font-medium">
            🔒 Row-Level Security active on all patient-specific tables.
          </div>
        </div>
      </div>
    </div>
  );
}
