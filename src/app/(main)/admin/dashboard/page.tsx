"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheckIcon,
  UsersIcon,
  HospitalIcon,
  AlertTriangleIcon,
  InboxIcon,
  SearchIcon,
  FilterIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface AdminInquiry {
  id: string;
  reference_code: string;
  user_id: string | null;
  full_name: string;
  email: string;
  category: string;
  message: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
  created_at: string;
  resolved_at: string | null;
}

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [, startTransition] = useTransition();

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.warn("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    startTransition(() => {
      fetchInquiries();
    });
    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === id ? { ...inq, status: newStatus as AdminInquiry["status"] } : inq
          )
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter !== "ALL" && inq.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && inq.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        inq.reference_code.toLowerCase().includes(term) ||
        inq.full_name.toLowerCase().includes(term) ||
        inq.email.toLowerCase().includes(term) ||
        inq.message.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          System Administration & Operations
        </h1>
        <p className="text-purple-200 text-sm max-w-2xl">
          Oversee platform health, user status, doctor verification, hospital telemetry integrations, and manage patient inquiries.
        </p>
      </div>

      {/* Admin Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <UsersIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Registered Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Verified Doctors</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Accredited</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <HospitalIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Hospital Network</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Connected</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <InboxIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase text-gray-500">Inquiries Received</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{inquiries.length}</p>
        </div>
      </div>

      {/* Admin Inquiry Management Console */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <InboxIcon className="h-5 w-5 text-indigo-600" />
              Patient & Platform Administrator Inquiries
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage incoming requests from the public Contact Administrator modal.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInquiries}>
            Refresh Inquiries
          </Button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <SearchIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN_REVIEW">IN REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="general">General</option>
            <option value="hospital_correction">Hospital Correction</option>
            <option value="appointment_assistance">Appointment Assistance</option>
            <option value="privacy_data_request">Privacy Request</option>
            <option value="account_assistance">Account Assistance</option>
          </select>
        </div>

        {/* Inquiries table / list */}
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading inquiries...</div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No inquiries matching the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {filteredInquiries.map((inq) => (
              <div key={inq.id} className="py-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      {inq.reference_code}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {inq.full_name}
                    </span>
                    <span className="text-gray-400">({inq.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="capitalize px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {inq.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        inq.status === "NEW"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          : inq.status === "IN_REVIEW"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                          : inq.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg">
                  {inq.message}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Submitted: {new Date(inq.created_at).toLocaleString()}</span>
                  <div className="flex items-center gap-1.5">
                    {inq.status !== "IN_REVIEW" && (
                      <button
                        onClick={() => updateStatus(inq.id, "IN_REVIEW")}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Mark In Review
                      </button>
                    )}
                    {inq.status !== "RESOLVED" && (
                      <button
                        onClick={() => updateStatus(inq.id, "RESOLVED")}
                        className="text-emerald-600 hover:underline font-semibold ml-2"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {inq.status !== "CLOSED" && (
                      <button
                        onClick={() => updateStatus(inq.id, "CLOSED")}
                        className="text-gray-500 hover:underline font-semibold ml-2"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operational Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Operational Management</h2>
          <div className="space-y-3">
            <Link
              href="/dispatch"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Ambulance Fleet & Dispatch Console</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Open Console →</span>
            </Link>
            <Link
              href="/hospitals"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Hospital Network Registry</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Manage →</span>
            </Link>
            <Link
              href="/appointments"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">All Appointment Schedules</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">View →</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs p-6 border border-gray-200 dark:border-gray-800 space-y-4">
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
