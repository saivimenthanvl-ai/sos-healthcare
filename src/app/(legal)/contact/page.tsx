"use client";

import { useState } from "react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MailIcon, CheckCircleIcon } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    // Direct mail client hand-off using verified SOS Healthcare contact
    const subject = encodeURIComponent("SOS Healthcare Support & Privacy Inquiry");
    const body = encodeURIComponent(`${message}\n\nReply to: ${email}`);
    window.location.href = `mailto:admin@sos-healthcare.vercel.app?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <LegalLayout title="Contact SOS Healthcare" subtitle="Patient Support & Privacy Desk">
      <LegalNotice variant="warning" title="Immediate Medical Emergency">
        If this is an acute life-threatening medical emergency, do NOT use this contact form. Dial your
        national emergency service (e.g., 112 in EU/India, 911 in US) or proceed to the nearest hospital emergency room.
      </LegalNotice>

      <section className="space-y-4" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          Get in touch with our team
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          For technical inquiries, account assistance, data rights requests, or feedback regarding SOS Healthcare:
        </p>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MailIcon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-gray-900 dark:text-white">Support & Privacy Desk:</span>
          <span className="text-blue-600 dark:text-blue-400">admin@sos-healthcare.vercel.app</span>
        </p>
      </section>

      <section className="space-y-4" aria-labelledby="message-heading">
        <h2 id="message-heading" className="text-xl font-bold text-gray-900 dark:text-white">
          Send a direct message
        </h2>
        {sent ? (
          <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            Your email client should have opened with the message draft. You can also contact us directly at admin@sos-healthcare.vercel.app.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input
              label="Your email address"
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
                placeholder="How can we assist you with SOS Healthcare? Do not include sensitive medical passwords or health details."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Send message
            </Button>
          </form>
        )}
      </section>
    </LegalLayout>
  );
}
