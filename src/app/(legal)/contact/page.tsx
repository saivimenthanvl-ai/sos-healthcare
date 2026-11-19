"use client";

import { useState } from "react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MailIcon, CheckCircleIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactPageTranslations } from "@/lib/i18n/contact-content";

export default function ContactPage() {
  const { language } = useLanguage();
  const cp = contactPageTranslations[language] || contactPageTranslations.en;

  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    // Direct mail client hand-off using verified SOS Healthcare contact
    const subject = encodeURIComponent("SOS Healthcare Support & Privacy Inquiry");
    const body = encodeURIComponent(`${message}\n\nReply to: ${email}`);
    window.location.href = `mailto:admin@soshospital.com?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <LegalLayout title={cp.title} subtitle={cp.subtitle}>
      <LegalNotice variant="warning" title={cp.emergencyNoticeTitle}>
        {cp.emergencyNoticeText}
      </LegalNotice>

      <section className="space-y-4" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          {cp.getInTouchHeading}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {cp.getInTouchDescription}
        </p>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MailIcon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-gray-900 dark:text-white">{cp.supportDeskLabel}</span>
          <span className="text-blue-600 dark:text-blue-400">admin@soshospital.com</span>
        </p>
      </section>

      <section className="space-y-4" aria-labelledby="message-heading">
        <h2 id="message-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          {cp.directMessageHeading}
        </h2>
        {sent ? (
          <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {cp.emailDraftSentSuccess}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input
              label={cp.emailLabel}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={cp.emailPlaceholder}
            />
            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                {cp.messageLabel}
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={cp.messagePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              {cp.sendButton}
            </Button>
          </form>
        )}
      </section>
    </LegalLayout>
  );
}
