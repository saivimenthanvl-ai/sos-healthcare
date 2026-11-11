import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Terms of Service | SOS Healthcare",
  description: "Terms of Service governing use of the SOS Healthcare emergency awareness, hospital discovery, and appointment planning platform.",
};

const toc = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "eligibility", label: "2. Eligibility & Account Security" },
  { id: "service-scope", label: "3. Nature of SOS Healthcare Services" },
  { id: "emergency-limitations", label: "4. Emergency Assistance & 112 Telephone Guidance" },
  { id: "hospital-directory", label: "5. Hospital Directory & Operational Status" },
  { id: "doctor-catalog", label: "6. Verified Doctor Catalog & Clinical Autonomy" },
  { id: "private-appointments", label: "7. Private Custom Appointment Planning" },
  { id: "rescheduling-cancellation", label: "8. Cancellation & Rescheduling Limitations" },
  { id: "no-hospital-affiliation", label: "9. No Implied Hospital Endorsement" },
  { id: "wearable-integrations", label: "10. Wearable & Google Health Integrations" },
  { id: "medical-disclaimer", label: "11. Medical Information & Clinical Disclaimer" },
  { id: "acceptable-use", label: "12. Acceptable Use & Prohibited Conduct" },
  { id: "user-responsibilities", label: "13. User Obligations & Accurate Data" },
  { id: "third-party-links", label: "14. Third-Party Maps & Services" },
  { id: "service-availability", label: "15. Service Availability & Maintenance" },
  { id: "intellectual-property", label: "16. Intellectual Property & Official SVG Branding" },
  { id: "limitation-liability", label: "17. Limitation of Liability" },
  { id: "suspension-termination", label: "18. Account Suspension & Termination" },
  { id: "dispute-resolution", label: "19. Dispute Resolution & Applicable Law" },
  { id: "modifications-terms", label: "20. Modifications to Terms" },
  { id: "contact-information", label: "21. Official Contact Information" },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="SOS Healthcare Platform"
      lastUpdated="11 November 2026"
      toc={toc}
    >
      <LegalNotice variant="warning" title="Emergency Services Disclaimer">
        SOS Healthcare is a supportive digital awareness platform, NOT a replacement for primary 911/112 public emergency medical services.
        If you or someone nearby is experiencing an acute, life-threatening crisis, dial your national emergency line (such as 112 or 911)
        immediately using a standard telephone. Do not rely solely on web software for emergency rescue.
      </LegalNotice>

      <LegalSection id="acceptance" number={1} heading="Acceptance of Terms">
        <p>
          By accessing, browsing, registering an account, or otherwise using the SOS Healthcare platform at
          <a href="https://sos-healthcare.vercel.app"> https://sos-healthcare.vercel.app</a> or associated APIs, you acknowledge that
          you have read, understood, and agreed to be legally bound by these Terms of Service. If you do not agree to these terms, you must
          cease using the platform immediately.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" number={2} heading="Eligibility & Account Security">
        <p>
          You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to establish an account independently.
          Minors may utilize the platform only under the active supervision of a parent or legal guardian who accepts these Terms on their behalf.
        </p>
        <p>
          You are responsible for safeguarding your login credentials (passwords, magic codes, or 6-digit email OTPs). Any actions originating
          from your authenticated session are considered authorized by you unless you immediately report unauthorized access to our support desk.
        </p>
      </LegalSection>

      <LegalSection id="service-scope" number={3} heading="Nature of SOS Healthcare Services">
        <p>
          SOS Healthcare is a modern health-technology interface designed to facilitate:
        </p>
        <ul>
          <li>Geographic discovery of nearby hospitals, trauma centers, and accredited medical clinics.</li>
          <li>Personal, patient-owned consultation planning and custom appointment organization.</li>
          <li>Location-aware emergency beacon generation to notify registered family and designated emergency contacts.</li>
          <li>Health profile record-keeping and wearable device synchronization via Google Health API.</li>
        </ul>
        <p>
          SOS Healthcare is a technology communication software and does not directly own or operate hospital treatment facilities,
          emergency medical vehicles, or public safety answering points.
        </p>
      </LegalSection>

      <LegalSection id="emergency-limitations" number={4} heading="Emergency Assistance & 112 Telephone Guidance">
        <p>
          The SOS Beacon feature generates a real-time event record with your browser-reported GPS coordinates and broadcasts your coordinates
          to your configured emergency contacts.
        </p>
        <ul>
          <li><strong>Direct Telephone Priority:</strong> In critical incidents, calling national emergency responders (e.g. 112) is the primary life-safety mechanism. Web alerts are secondary supplementary tools.</li>
          <li><strong>No Guaranteed Ambulance Dispatch:</strong> The software transmits beacon data across the internet but does not guarantee immediate physical vehicle dispatch, roadway right-of-way, or paramedic arrival times.</li>
        </ul>
      </LegalSection>

      <LegalSection id="hospital-directory" number={5} heading="Hospital Directory & Operational Status">
        <p>
          The hospital listings on SOS Healthcare aggregate publicly verified institutional data, including facility addresses, contact
          telephones, and department capabilities.
        </p>
        <p>
          While we strive for accuracy, hospital emergency departments experience dynamic, unpredicted surges in patient triage.
          Estimated driving times and Department indicators (such as Emergency Care Facility or Outpatient Center) are informational
          estimates and do not constitute real-time guaranteed bed availability or triage admittance.
        </p>
      </LegalSection>

      <LegalSection id="doctor-catalog" number={6} heading="Verified Doctor Catalog & Clinical Autonomy">
        <p>
          Healthcare professionals listed in the specialist directory are independent accredited practitioners. SOS Healthcare does not
          interfere with the clinical judgment or diagnostic autonomy of physicians. Consultations planned through the platform reflect
          mutual scheduling intent between patients and clinicians.
        </p>
      </LegalSection>

      <LegalSection id="private-appointments" number={7} heading="Private Custom Appointment Planning">
        <LegalNotice variant="info" title="Personal Consultation Planner">
          Private custom appointment requests created on hospital cards are saved exclusively within your SOS Healthcare Supabase account.
          Creating a request in this software does NOT represent a pre-confirmed reservation in a hospital electronic health records (EHR) database.
        </LegalNotice>
        <p>
          Custom requests help you track planned visits, note medical concerns, and coordinate private consultation details.
          Confirmation status within the app indicates verified coordination with participating specialists, not an automated hospital intake.
        </p>
      </LegalSection>

      <LegalSection id="rescheduling-cancellation" number={8} heading="Cancellation & Rescheduling Limitations">
        <p>
          Patients may reschedule or cancel active appointment requests directly within the Appointments module.
        </p>
        <p>
          <em>Important:</em> Cancelling an appointment request in SOS Healthcare updates your private account record. It does not automatically
          cancel external appointments that you may have independently booked directly with a hospital or clinic front desk. You remain responsible
          for notifying physical clinics if you cannot attend.
        </p>
      </LegalSection>

      <LegalSection id="no-hospital-affiliation" number={9} heading="No Implied Hospital Endorsement">
        <p>
          The inclusion of a healthcare institution or specialist in our directory does not imply commercial affiliation, exclusive endorsement,
          or operational partnership between SOS Healthcare and the named hospital, unless explicitly stated under a formal mutual partnership.
        </p>
      </LegalSection>

      <LegalSection id="wearable-integrations" number={10} heading="Wearable & Google Health Integrations">
        <p>
          Our application integrates with Google Health API OAuth 2.0 and displays status indicators for smart wearables (such as Apple Health
          or Wear OS companion applications).
        </p>
        <ul>
          <li><strong>Informational Use Only:</strong> Wearable metrics (heart rate, step cadence, SpO2) displayed in the application are designed for general wellness and awareness. They are not medical-grade diagnostic telemetry.</li>
          <li><strong>No Automated Critical Dispatch:</strong> We do not guarantee automated paramedic dispatch in response to wearable vitals spikes or fall sensor data unless supported by verified clinical monitoring systems.</li>
        </ul>
      </LegalSection>

      <LegalSection id="medical-disclaimer" number={11} heading="Medical Information & Clinical Disclaimer">
        <p>
          NO CONTENT ON SOS HEALTHCARE CONSTITUTES MEDICAL ADVICE, CLINICAL DIAGNOSIS, OR TREATMENT PRESCRIPTION.
          Always seek the guidance of a qualified healthcare provider with any questions you may have regarding a medical condition.
          Never disregard professional medical advice or delay seeking care because of information viewed on this platform.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" number={12} heading="Acceptable Use & Prohibited Conduct">
        <p>When using SOS Healthcare, you agree NOT to:</p>
        <ul>
          <li>Trigger false, synthetic, or abusive SOS emergency beacons that disrupt platform operations or waste responder time.</li>
          <li>Input fraudulent medical profiles, impersonate licensed healthcare personnel, or misrepresent patient identity.</li>
          <li>Attempt to reverse-engineer, decompile, scrape, or probe vulnerabilities in platform APIs or Supabase databases.</li>
          <li>Bypass security controls, Row-Level Security policies, or authentication boundaries.</li>
        </ul>
      </LegalSection>

      <LegalSection id="user-responsibilities" number={13} heading="User Obligations & Accurate Data">
        <p>
          You are responsible for ensuring that blood group indicators, allergies, and emergency contact phone numbers saved in your profile
          are kept current and accurate. SOS Healthcare cannot be held liable for misdirected communications resulting from inaccurate contact inputs.
        </p>
      </LegalSection>

      <LegalSection id="third-party-links" number={14} heading="Third-Party Maps & Services">
        <p>
          Our platform embeds navigation routes and map features powered by external providers (such as Google Maps). Your interaction with
          third-party mapping tools is governed by their respective terms of service and privacy agreements.
        </p>
      </LegalSection>

      <LegalSection id="service-availability" number={15} heading="Service Availability & Maintenance">
        <p>
          We strive to maintain continuous platform availability. However, service disruptions may occasionally occur due to internet routing
          outages, scheduled maintenance, cellular carrier failures, or cloud hosting updates. SOS Healthcare is provided on an &quot;AS IS&quot;
          and &quot;AS AVAILABLE&quot; basis without warranties of uninterrupted uptime.
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" number={16} heading="Intellectual Property & Official SVG Branding">
        <p>
          The SOS Healthcare software, user interface design, source code, and the official red medical-cross SVG branding are the proprietary
          intellectual property of the project operator. All rights not expressly granted are reserved.
        </p>
      </LegalSection>

      <LegalSection id="limitation-liability" number={17} heading="Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, SOS HEALTHCARE, ITS DEVELOPERS, AND OPERATORS SHALL NOT BE LIABLE FOR ANY
          DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PLATFORM,
          DELAYED EMERGENCY COMMUNICATIONS, CELLULAR CARRIER DISCONNECTIONS, OR CLINICAL OUTCOMES RESULTING FROM INDEPENDENT MEDICAL TREATMENT.
        </p>
      </LegalSection>

      <LegalSection id="suspension-termination" number={18} heading="Account Suspension & Termination">
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, engage in abusive SOS beacon triggering, or pose
          security risks to the platform, without prior notice.
        </p>
      </LegalSection>

      <LegalSection id="dispute-resolution" number={19} heading="Dispute Resolution & Applicable Law">
        <p>
          These Terms of Service are governed by applicable national and local laws. Any controversy or claim arising out of or relating to
          these terms shall be resolved through good-faith negotiation prior to formal dispute proceedings.
        </p>
      </LegalSection>

      <LegalSection id="modifications-terms" number={20} heading="Modifications to Terms">
        <p>
          We reserve the right to revise these Terms at any time. Continued use of the platform after revised terms are posted constitutes
          your binding acceptance of the changes.
        </p>
      </LegalSection>

      <LegalSection id="contact-information" number={21} heading="Official Contact Information">
        <p>
          For contractual inquiries, legal notices, or feedback regarding these Terms:
        </p>
        <ul>
          <li><strong>Organization:</strong> SOS Healthcare Project Administration</li>
          <li><strong>Website:</strong> <a href="https://sos-healthcare.vercel.app">https://sos-healthcare.vercel.app</a></li>
          <li><strong>Contact Form:</strong> <a href="/contact">Public Support & Inquiry Portal</a></li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
