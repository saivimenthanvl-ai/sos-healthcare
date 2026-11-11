"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { ContactAdminModal } from "@/components/ContactAdminModal";
import { Button } from "@/components/ui/Button";
import { MailIcon } from "lucide-react";

export default function PrivacyPolicyPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const toc = [
    { id: "introduction", label: "Introduction" },
    { id: "information-collected", label: "Information We Collect" },
    { id: "purpose-of-collecting", label: "Purpose of Collecting Information" },
    { id: "patient-privacy", label: "Patient Privacy and Confidentiality" },
    { id: "hospital-directory", label: "Hospital Information and Directory Services" },
    { id: "private-appointments", label: "Private Appointment Requests" },
    { id: "emergency-assistance", label: "Emergency Assistance and Location Information" },
    { id: "health-wearables", label: "Health and Wearable Information" },
    { id: "patient-consent", label: "Patient Consent and Control" },
    { id: "healthcare-sharing", label: "Healthcare Information Sharing and Confidentiality" },
    { id: "patient-safeguards", label: "Patient Information Safeguards" },
    { id: "information-retention", label: "Information Retention" },
    { id: "patient-rights", label: "Patient Rights" },
    { id: "childrens-privacy", label: "Children's Privacy" },
    { id: "international-awareness", label: "International Healthcare Awareness" },
    { id: "policy-updates", label: "Policy Updates" },
    { id: "contact-administrator", label: "Contact Administrator" },
  ];

  return (
    <>
      <LegalLayout
        title="Privacy Policy"
        subtitle="SOS Healthcare Patient Portal"
        lastUpdated="11 November 2026"
        toc={toc}
      >
        <LegalNotice variant="info" title="Patient Privacy Commitment">
          SOS Healthcare is dedicated to patient privacy, transparency, and personal health data control.
          Appointment requests created within our portal are maintained securely within the platform and are
          never automatically transmitted to hospital databases or external electronic health records.
        </LegalNotice>

        <LegalSection id="introduction" number={1} heading="Introduction">
          <p>
            SOS Healthcare provides healthcare awareness, nearby hospital discovery, emergency telephone guidance,
            and private appointment-planning services.
          </p>
          <p>
            This Privacy Policy describes how personal information and healthcare preferences are collected, used,
            protected, and handled when you access our application. SOS Healthcare is a software assistance platform
            and does not directly own or operate hospital treatment centers.
          </p>
        </LegalSection>

        <LegalSection id="information-collected" number={2} heading="Information We Collect">
          <p>
            We collect only the information necessary to fulfill our digital healthcare awareness and planning services:
          </p>
          <ul>
            <li><strong>Name and Contact Details:</strong> Name and email address used for account registration and authentication.</li>
            <li><strong>Account Information:</strong> Profile credentials, preferences, and security access logs.</li>
            <li><strong>Emergency Contact Details:</strong> Names, phone numbers, and relationship designations for family or trusted individuals you choose to notify during emergencies.</li>
            <li><strong>Location Information:</strong> Real-time browser GPS coordinates when explicitly permitted by you to calculate driving distances to nearby medical centers or transmit coordinates during an emergency beacon.</li>
            <li><strong>Private Appointment Requests:</strong> Selected medical specialties, preferred dates, visit reasons, and status notes saved in your personal planner.</li>
            <li><strong>Hospital Preferences:</strong> Bookmarked facilities and search history.</li>
            <li><strong>Optional Health Information:</strong> Self-reported blood group, vitals, allergies, and chronic medical history stored in your health profile.</li>
            <li><strong>Wearable-Device Information:</strong> Heart rate, step count, or activity telemetry accessed only when you explicitly connect Google Health.</li>
            <li><strong>Support Inquiries:</strong> Communications submitted through our administrator inquiry form.</li>
          </ul>
        </LegalSection>

        <LegalSection id="purpose-of-collecting" number={3} heading="Purpose of Collecting Information">
          <p>We process your information for clear, patient-centered purposes:</p>
          <ul>
            <li>Managing your patient account and authenticating your access securely.</li>
            <li>Helping you identify and locate nearby accredited healthcare facilities.</li>
            <li>Maintaining your private consultation requests and personal scheduling notes.</li>
            <li>Supporting emergency contact notifications when an SOS beacon is activated.</li>
            <li>Displaying authorized wearable wellness data in your patient dashboard.</li>
            <li>Responding to platform feedback and administrative support requests.</li>
            <li>Protecting accounts against unauthorized access and preventing platform misuse.</li>
          </ul>
        </LegalSection>

        <LegalSection id="patient-privacy" number={4} heading="Patient Privacy and Confidentiality">
          <p>
            SOS Healthcare restricts access to personal information to legitimate, authorized purposes.
            Your health records and private consultation preferences are confidential. We maintain technical
            controls so that individual patient information is accessible only to the authenticated account holder.
          </p>
        </LegalSection>

        <LegalSection id="hospital-directory" number={5} heading="Hospital Information and Directory Services">
          <p>
            Hospital and clinic information is compiled from public healthcare listings to help users identify
            medical facilities in their area.
          </p>
          <p>
            Inclusion in our directory does not automatically establish a formal commercial relationship, affiliation,
            or operational partnership between SOS Healthcare and the hospital.
          </p>
        </LegalSection>

        <LegalSection id="private-appointments" number={6} heading="Private Appointment Requests">
          <LegalNotice variant="info" title="Important Notice Regarding Appointment Requests">
            &quot;Appointment requests saved through SOS Healthcare are maintained within the SOS Healthcare platform
            and are not automatically submitted to hospitals or added to hospital medical records.&quot;
          </LegalNotice>
          <p>
            Saving a request in your portal does not guarantee hospital availability or confirm an appointment slot
            with hospital staff. Patients may reschedule or cancel their private requests at any time.
          </p>
          <p>
            Cancelling a private request in SOS Healthcare does not cancel an independently arranged appointment at a
            hospital clinic. External hospital booking requires a separately authorized, verified integration.
          </p>
        </LegalSection>

        <LegalSection id="emergency-assistance" number={7} heading="Emergency Assistance and Location Information">
          <p>
            Location permission is requested only when necessary to calculate proximity to nearby hospitals or when
            initiating an emergency beacon.
          </p>
          <p>
            When an SOS beacon is activated, your browser-reported coordinates at that moment are transmitted to your
            registered emergency contacts. SOS Healthcare does not track your location in the background when the app
            is inactive. Public emergency responders (such as 112 or 911 dispatchers) do not automatically receive
            web beacon data unless formal municipal dispatch connectivity is verified in your jurisdiction.
          </p>
          <p>
            You may withdraw location permissions at any time through your device or browser settings.
          </p>
        </LegalSection>

        <LegalSection id="health-wearables" number={8} heading="Health and Wearable Information">
          <p>
            Connected wearable information (such as Google Health API integration) is retrieved only with your explicit
            permission. Data is queried on-demand to display wellness trends in your portal.
          </p>
          <p>
            Connecting a wearable device does not create an automated emergency ambulance dispatch service. You may
            revoke access at any time via your Devices settings or your Google Account permissions, which immediately
            terminates data retrieval and purges cached metrics.
          </p>
        </LegalSection>

        <LegalSection id="patient-consent" number={9} heading="Patient Consent and Control">
          <p>
            We believe patients should maintain granular control over their information. You can review and update
            permissions at any time:
          </p>
          <ul>
            <li>Modify emergency contact details and notification settings.</li>
            <li>Toggle doctor pre-arrival sharing preferences in your Health Profile.</li>
            <li>Disconnect wearable services with immediate token invalidation.</li>
            <li>Request deletion of your account and personal records.</li>
          </ul>
        </LegalSection>

        <LegalSection id="healthcare-sharing" number={10} heading="Healthcare Information Sharing and Confidentiality">
          <p>
            Personal or health information is never automatically disclosed to hospitals merely because a user browses
            a hospital card or saves a private appointment request.
          </p>
          <p>Information may only be disclosed under the following circumstances:</p>
          <ul>
            <li>With your explicit, verified authorization.</li>
            <li>To designated emergency contacts when you actively trigger an emergency beacon.</li>
            <li>To essential infrastructure service providers necessary to operate the application.</li>
            <li>Where required by applicable law, statutory subpoena, or valid court order.</li>
          </ul>
        </LegalSection>

        <LegalSection id="patient-safeguards" number={11} heading="Patient Information Safeguards">
          <p>
            We implement administrative and technical safeguards designed to protect personal information:
          </p>
          <ul>
            <li>Access to private accounts and appointment records is strictly restricted to authenticated users.</li>
            <li>Health information and emergency notes are handled with high standards of confidentiality.</li>
            <li>Database isolation rules ensure that users cannot inspect other patients&apos; data.</li>
            <li>Encrypted transport protocols protect information exchanged between your device and our servers.</li>
          </ul>
          <p>
            Users are encouraged to protect their account credentials and report any suspected unauthorized access
            to our administration desk immediately.
          </p>
        </LegalSection>

        <LegalSection id="information-retention" number={12} heading="Information Retention">
          <p>
            Records are retained only for as long as your account remains active or as needed to deliver our healthcare
            planning and awareness features.
          </p>
          <p>
            Private appointment requests, emergency logs, and support inquiries are retained within your secure portal
            until you remove them or submit an account closure request.
          </p>
        </LegalSection>

        <LegalSection id="patient-rights" number={13} heading="Patient Rights">
          <p>Depending on your jurisdiction, you may exercise applicable rights regarding your information:</p>
          <ul>
            <li>Request access to the personal information we maintain about you.</li>
            <li>Request correction of inaccurate or incomplete health profile records.</li>
            <li>Withdraw optional consent for location or health device integrations.</li>
            <li>Request deletion of your account where permitted by applicable law.</li>
            <li>Submit questions or privacy inquiries to our administration team.</li>
          </ul>
        </LegalSection>

        <LegalSection id="childrens-privacy" number={14} heading="Children's Privacy">
          <p>
            SOS Healthcare is designed for use by individuals who have reached the age of majority or minors using the
            service under the active supervision and consent of a parent or legal guardian.
          </p>
        </LegalSection>

        <LegalSection id="international-awareness" number={15} heading="International Healthcare Awareness">
          <p>
            SOS Healthcare provides information across 22 languages to assist users internationally. Providing
            multilingual information does not imply local clinical licensing, direct hospital operational affiliation,
            or municipal emergency dispatch coverage in every country.
          </p>
        </LegalSection>

        <LegalSection id="policy-updates" number={16} heading="Policy Updates">
          <p>
            We may periodically update this policy to reflect enhancements in patient safety, new platform features,
            or evolving legal standards. The latest revision date is prominently displayed at the top of this document.
          </p>
        </LegalSection>

        <LegalSection id="contact-administrator" number={17} heading="Contact Administrator">
          <p>
            For privacy inquiries, patient data requests, or directory corrections, you may contact our administration
            desk directly:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            Administrative Email: <a href="mailto:admin@soshospital.com">admin@soshospital.com</a>
          </p>
          <div className="pt-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2"
            >
              <MailIcon className="h-4 w-4" />
              <span>Contact Administrator</span>
            </Button>
          </div>
        </LegalSection>
      </LegalLayout>

      <ContactAdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
