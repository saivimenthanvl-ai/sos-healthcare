"use client";

import { useState } from "react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MailIcon, CheckCircleIcon } from "lucide-react";

const SUPPORT_EMAIL = "admin@fyzer.com";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    // No backend inbox is wired up, so hand the message to the user's own
    // mail client rather than silently dropping it.
    const subject = encodeURIComponent("Fyzer support request");
    const body = encodeURIComponent(`${message}\n\nReply to: ${email}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <LegalLayout title="Contact Fyzer" subtitle="Fyzer Healthcare Platform">
      <LegalNotice variant="warning" title="Medical emergency">
        If this is a medical emergency, do not use this page. Contact your local
        emergency medical service or go to the nearest emergency department.
      </LegalNotice>

      <section className="space-y-4" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          Get in touch
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          For administrative, privacy, account or platform-related enquiries:
        </p>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MailIcon className="h-4 w-4" aria-hidden="true" />
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-blue-600 dark:text-blue-400 underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <MailIcon className="h-4 w-4" aria-hidden="true" />
          Email Support
        </a>
      </section>

      <section className="space-y-4" aria-labelledby="message-heading">
        <h2 id="message-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          Send a message
        </h2>
        {sent ? (
          <p className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            Your email client should have opened with the message. If it did not,
            email the address below directly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input
              label="Your email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help. Do not include medical details you would not want stored in email."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" variant="primary">
              Send message
            </Button>
          </form>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Or email us directly at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-blue-600 dark:text-blue-400 underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}