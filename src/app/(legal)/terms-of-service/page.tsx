"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { ContactAdminModal } from "@/components/ContactAdminModal";
import { Button } from "@/components/ui/Button";
import { MailIcon } from "lucide-react";

export default function TermsOfServicePage() {
  const [modalOpen, setModalOpen] = useState(false);

  const toc = [
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "eligibility", label: "Eligibility and Account Responsibilities" },
    { id: "services", label: "Nature of SOS Healthcare Services" },
    { id: "hospitals", label: "Hospital Directory Information" },
    { id: "doctors", label: "Doctor Information" },
    { id: "private-appointments", label: "Private Appointment Requests" },
    { id: "cancellation", label: "Cancellation and Rescheduling" },
    { id: "emergency", label: "Emergency Assistance" },
    { id: "medical-disclaimer", label: "Medical Information Disclaimer" },
    { id: "wearables", label: "Wearable Devices" },
    { id: "responsibilities", label: "Patient Responsibilities" },
    { id: "prohibited", label: "Prohibited Conduct" },
    { id: "privacy", label: "Privacy and Patient Confidentiality" },
    { id: "availability", label: "Service Availability" },
    { id: "fees", label: "Service Fees" },
    { id: "suspension", label: "Account Suspension and Closure" },
    { id: "changes", label: "Changes to Terms" },
    { id: "disputes", label: "Applicable Law and Dispute Resolution" },
    { id: "administrative-contact", label: "Administrative Contact" },
  ];

  return (
    <>
      <LegalLayout
        title="Terms of Service"
        subtitle="Healthcare Service Rules & Conditions of Use"
        lastUpdated="11 November 2026"
        toc={toc}
      >
        <LegalNotice variant="warning" title="Emergency Medical Notice">
          SOS Healthcare is an informational assistance platform and is not a substitute for official emergency
          responders. In a life-threatening crisis, immediately dial your local emergency telephone service.
        </LegalNotice>

        <LegalSection id="acceptance" number={1} heading="Acceptance of Terms">
          <p>
            By accessing, registering for, or using SOS Healthcare services, you acknowledge that you have read and
            understood these Terms of Service and agree to comply with the applicable conditions of use. If you do
            not agree with these terms, you should discontinue use of the services.
          </p>
        </LegalSection>

        <LegalSection id="eligibility" number={2} heading="Eligibility and Account Responsibilities">
          <p>
            Users must be of legal age of majority or use the platform under the supervision of a parent or legal guardian.
            You agree to provide accurate information when creating an account, safeguard your credentials, and report any
            unauthorized access promptly. You remain responsible for all activities originating from your account.
          </p>
        </LegalSection>

        <LegalSection id="services" number={3} heading="Nature of SOS Healthcare Services">
          <p>
            SOS Healthcare provides digital healthcare awareness, nearby hospital discovery, emergency telephone guidance,
            private appointment planning, and authorized health-device information display.
          </p>
          <p>
            The platform is a communication and planning tool and does not provide direct medical treatment or clinical
            prescriptions.
          </p>
        </LegalSection>

        <LegalSection id="hospitals" number={4} heading="Hospital Directory Information">
          <p>
            Hospital names, addresses, and listed departments are provided for general informational orientation.
            Directory details may change, and emergency triage availability should always be verified directly with the
            facility. Inclusion in our directory does not imply formal partnership or commercial endorsement.
          </p>
        </LegalSection>

        <LegalSection id="doctors" number={5} heading="Doctor Information">
          <p>
            Information regarding medical specialists is intended to help users identify independent healthcare providers.
            Listed doctors are not partners of the platform, and listing does not imply an exclusive endorsement or
            automated intake agreement without verified authorization.
          </p>
        </LegalSection>

        <LegalSection id="private-appointments" number={6} heading="Private Appointment Requests">
          <p>
            The platform allows patients to store personal appointment preferences and consultation requests.
            These requests do not create hospital-confirmed reservations. Hospital schedules and front-desk booking
            procedures may differ, and users are responsible for confirming actual visits directly with the hospital.
          </p>
        </LegalSection>

        <LegalSection id="cancellation" number={7} heading="Cancellation and Rescheduling">
          <p>
            Patients may cancel or reschedule eligible private requests within their portal. Modifying a request affects
            only the record stored in SOS Healthcare; it does not automatically cancel an independently arranged hospital
            appointment. Cancellation records are retained in accordance with the Privacy Policy.
          </p>
        </LegalSection>

        <LegalSection id="emergency" number={8} heading="Emergency Assistance">
          <p>
            SOS Healthcare is not a substitute for official public emergency services. Users must contact their local
            emergency number (e.g. 112, 911, or local emergency line) for life-threatening emergencies.
          </p>
          <p>
            Transmitting an SOS beacon notifies designated emergency contacts via the app; emergency contacts are not
            equivalent to municipal ambulance dispatch providers.
          </p>
        </LegalSection>

        <LegalSection id="medical-disclaimer" number={9} heading="Medical Information Disclaimer">
          <p>
            Information provided on the platform is educational and informational. It is not medical advice, diagnosis,
            or treatment. Users should consult licensed healthcare professionals regarding any health condition.
            Emergency symptoms require urgent attention from licensed emergency providers.
          </p>
        </LegalSection>

        <LegalSection id="wearables" number={10} heading="Wearable Devices">
          <p>
            Wearable data displayed through integrations (such as Google Health) depends on third-party sensor accuracy.
            Measurements may be delayed or unavailable. Wearable data is not diagnostic clinical information, and no
            automatic emergency response is promised based on wearable metrics.
          </p>
        </LegalSection>

        <LegalSection id="responsibilities" number={11} heading="Patient Responsibilities">
          <p>
            Patients are responsible for maintaining accurate contact details, using emergency features conscientiously,
            and respecting the confidentiality of personal medical information stored in their accounts.
          </p>
        </LegalSection>

        <LegalSection id="prohibited" number={12} heading="Prohibited Conduct">
          <p>Users may not:</p>
          <ul>
            <li>Attempt unauthorized access to other accounts or administrative systems.</li>
            <li>Trigger fraudulent or abusive emergency beacons that waste responder resources.</li>
            <li>Harass healthcare providers, administrators, or other patients.</li>
            <li>Misrepresent professional medical credentials or patient identity.</li>
            <li>Interfere with the security or operational integrity of the service.</li>
          </ul>
        </LegalSection>

        <LegalSection id="privacy" number={13} heading="Privacy and Patient Confidentiality">
          <p>
            Handling of personal information and healthcare preferences is governed by our Privacy Policy.
            Please review the Privacy Policy for details regarding our confidentiality safeguards and patient rights.
          </p>
        </LegalSection>

        <LegalSection id="availability" number={14} heading="Service Availability">
          <p>
            Platform availability depends on cellular connectivity, internet routing, and scheduled maintenance.
            While we aim for reliable service, uninterrupted healthcare software availability cannot be guaranteed.
          </p>
        </LegalSection>

        <LegalSection id="fees" number={15} heading="Service Fees">
          <p>
            Access to the SOS Healthcare digital platform is free for users. External hospital, consultation,
            transportation, or medical treatment fees charged by independent healthcare providers remain the
            responsibility of the patient.
          </p>
        </LegalSection>

        <LegalSection id="suspension" number={16} heading="Account Suspension and Closure">
          <p>
            We reserve the right to suspend or close accounts that engage in fraudulent emergency alerts, violate
            acceptable use rules, or compromise platform security, subject to applicable notice and review procedures.
          </p>
        </LegalSection>

        <LegalSection id="changes" number={17} heading="Changes to Terms">
          <p>
            Material changes to these Terms will be communicated through the platform with an updated version date.
            Continued use following updates constitutes agreement to the revised conditions.
          </p>
        </LegalSection>

        <LegalSection id="disputes" number={18} heading="Applicable Law and Dispute Resolution">
          <p>
            These Terms are governed by applicable national consumer and digital healthcare regulations.
            Disputes should first be addressed through good-faith administrative communication before pursuing formal
            proceedings.
          </p>
        </LegalSection>

        <LegalSection id="administrative-contact" number={19} heading="Administrative Contact">
          <p>
            For questions regarding these service conditions, please contact our administrative desk:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            Email: <a href="mailto:admin@soshospital.com">admin@soshospital.com</a>
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
