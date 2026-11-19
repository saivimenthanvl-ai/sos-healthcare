"use client";

import { useState } from "react";
import { XIcon, CheckCircle2Icon, AlertCircleIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactModalTranslations } from "@/lib/i18n/contact-content";

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactAdminModal({ isOpen, onClose }: ContactAdminModalProps) {
  const { user, profile } = useAuth();
  const { language, dir } = useLanguage();
  const tm = contactModalTranslations[language] || contactModalTranslations.en;

  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successReference, setSuccessReference] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !message || !consent) {
      setError(tm.errorRequired);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          category,
          message,
          consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setSuccessReference(data.reference_code || "INQ-CONFIRMED");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessReference(null);
    setMessage("");
    setConsent(false);
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-admin-title"
    >
      <div
        dir={dir}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 id="contact-admin-title" className="text-lg font-bold text-gray-950 dark:text-white">
              {tm.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tm.subtitle}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close dialog"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {successReference ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2Icon className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-gray-950 dark:text-white">
                {tm.successTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {tm.successMessage}{" "}
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                  {successReference}
                </span>.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tm.successDeskNote}
              </p>
              <Button onClick={resetForm} variant="outline" className="mt-4">
                {tm.closeButton}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-[11px] text-amber-900 dark:text-amber-200">
                <strong>Notice:</strong> {tm.notice}
              </div>

              <Input
                label={tm.fullNameLabel}
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tm.fullNamePlaceholder}
              />

              <Input
                label={tm.emailLabel}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tm.emailPlaceholder}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {tm.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">{tm.categories.general}</option>
                  <option value="hospital_correction">{tm.categories.hospital_correction}</option>
                  <option value="appointment_assistance">{tm.categories.appointment_assistance}</option>
                  <option value="privacy_data_request">{tm.categories.privacy_data_request}</option>
                  <option value="account_assistance">{tm.categories.account_assistance}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {tm.messageLabel}
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={tm.messagePlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="admin-inquiry-consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="h-4 w-4 rounded text-blue-600 mt-0.5"
                />
                <label htmlFor="admin-inquiry-consent" className="text-[11px] text-gray-600 dark:text-gray-400">
                  {tm.consentText}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={loading}>
                  {tm.cancelButton}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  disabled={loading || !fullName || !email || !message || !consent}
                  className="flex items-center gap-1.5"
                >
                  <SendIcon className="h-3.5 w-3.5" />
                  <span>{loading ? tm.sendingButton : tm.sendButton}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
