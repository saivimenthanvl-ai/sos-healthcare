"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthenticatedDashboardView } from "@/components/AuthenticatedDashboardView";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const role = (profile?.role || "PATIENT").toUpperCase();
    if (role === "DOCTOR") {
      router.replace("/doctor/dashboard");
    } else if (role === "ADMIN" || role === "DISPATCHER" || role === "PARAMEDIC") {
      router.replace("/admin/dashboard");
    }
  }, [profile, router]);

  return <AuthenticatedDashboardView />;
}

