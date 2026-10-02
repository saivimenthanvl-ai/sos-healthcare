"use client";

import { useState } from "react";
import { LegalPage, Section } from "@/components/LegalPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  PhoneCallIcon,
  MailIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    // There is no support inbox wired up yet, so hand the message to the
    // user's own mail client rather than silently dropping it.
    const subject = encodeURIComponent("SOS Healthcare support request");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:support@sos-healthcare.example?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <LegalPage title="Contact" updated="October 2026">
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          <strong>If this is a medical emergency, do not use this form.</strong>{" "}
          Call your local emergency number now.
        </p>
      </div>

      <Section heading="Emergency">
        <p className="flex items-center gap-2 text-red-700 font-medium text-base">
          <PhoneCallIcon className="h-5 w-5" />
          Call your local emergency number
        </p>
        <p>
          SOS Healthcare is a software platform and cannot send an ambulance by
          phone. If someone is unresponsive, having a seizure, bleeding, not
          breathing, or in suspected cardiac arrest, call for help directly.
        </p>
      </Section>

      <Section heading="Support">
        <p className="flex items-center gap-2">
          <MailIcon className="h-4 w-4 text-gray-400" />
          <a
            href="mailto:support@sos-healthcare.example"
            className="text-blue-600 hover:underline"
          >
            support@sos-healthcare.example
          </a>
        </p>
        <p>
          For account problems, a crew who never arrived, or to report an
          incorrect hospital listing. We aim to reply within one business day.
        </p>
      </Section>

      <Section heading="Send a message">
        {sent ? (
          <p className="flex items-center gap-2 text-green-700">
            <CheckCircleIcon className="h-5 w-5" />
            Your email client should have opened with the message. If it did
            not, email the address above directly.
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened. Do not include medical details you would not want stored in email."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" variant="primary">
              Send message
            </Button>
          </form>
        )}
      </Section>
    </LegalPage>
  );
}