import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Privacy Policy | SOS Healthcare",
  description: "Official Privacy Policy explaining how SOS Healthcare handles account, location, appointment planning, emergency, and health data.",
};

const toc = [
  { id: "operator", label: "1. Responsible Operator & Platform Scope" },
  { id: "information-collected", label: "2. Information We Genuinely Collect" },
  { id: "purposes-of-processing", label: "3. Purposes of Processing" },
  { id: "location-data", label: "4. Location Data & Real-Time Permissions" },
  { id: "emergency-sos-data", label: "5. Emergency Beacon & Contact Data" },
  { id: "private-appointment-requests", label: "6. Private Custom Appointment Requests" },
  { id: "google-health-wearables", label: "7. Google Health & Wearable Integrations" },
  { id: "lawful-basis-consent", label: "8. Lawful Basis & Explicit Consent" },
  { id: "data-sharing-recipients", label: "9. Data Sharing & Authorized Recipients" },
  { id: "third-party-infrastructure", label: "10. Third-Party Infrastructure & Subprocessors" },
  { id: "security-safeguards", label: "11. Security Controls Implemented" },
  { id: "data-retention", label: "12. Data Retention & Minimization" },
  { id: "user-rights", label: "13. User Rights, Revocation & Deletion" },
  { id: "cross-border-transfers", label: "14. Cross-Border Data Processing" },
  { id: "childrens-privacy", label: "15. Children's Privacy" },
  { id: "cookies-technical", label: "16. Cookies, Sessions & Local Storage" },
  { id: "policy-changes", label: "17. Policy Modifications & Version History" },
  { id: "privacy-contact", label: "18. Privacy Enquiries & Operator Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="SOS Healthcare Platform"
      lastUpdated="11 November 2026"
      toc={toc}
    >
      <LegalNotice variant="info" title="Authoritative English Policy">
        This document represents the authoritative, legally operative Privacy Policy for SOS Healthcare.
        Translated versions across our 17 supported languages are provided for accessibility and patient awareness.
        Private appointment requests and SOS beacons remain securely within the SOS Healthcare Supabase infrastructure and
        are not automatically transmitted to external hospital electronic health records (EHR) without a verified clinical agreement.
      </LegalNotice>

      <LegalSection id="operator" number={1} heading="Responsible Operator & Platform Scope">
        <p>
          SOS Healthcare (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a digital healthcare awareness and assistance platform,
          incorporating nearby hospital discovery, personal consultation planning, wearable device monitoring, and location-aware
          emergency beacon workflows.
        </p>
        <p>
          This Privacy Policy governs the collection, processing, storage, and protection of personal data and protected health details
          when you access our web application at <a href="https://sos-healthcare.vercel.app">https://sos-healthcare.vercel.app</a> or
          interact with our API endpoints.
        </p>
        <p>
          <em>Legal Entity Status:</em> The platform operates under SOS Healthcare project administration. Where international legal
          registrations (such as formal HIPAA Business Associate agreements, EU GDPR representative designations, or Indian DPDP
          data fiduciary registrations) require localized entity identification, formal publication is subject to legal review.
        </p>
      </LegalSection>

      <LegalSection id="information-collected" number={2} heading="Information We Genuinely Collect">
        <p>
          In accordance with data minimization principles, SOS Healthcare collects only the information necessary to fulfill platform
          functions. We genuinely process:
        </p>
        <ul>
          <li><strong>Identity & Account Credentials:</strong> Full name, verified email address, hashed authentication credentials, or OAuth profile tokens (via Google or Supabase Auth).</li>
          <li><strong>Emergency Profile Details:</strong> Blood group, physical measurements (height, weight, computed BMI), vital signs (blood pressure, heart rate, oxygen saturation SpO2, body temperature), self-reported allergies, current medications, and existing medical conditions.</li>
          <li><strong>Emergency Contact Records:</strong> Names, telephone numbers, and relationship designations for individuals you explicitly designate to receive emergency alerts.</li>
          <li><strong>Real-Time Geolocation:</strong> Browser-reported GPS coordinates (latitude, longitude, and accuracy radius) obtained with explicit permission.</li>
          <li><strong>Private Appointment Requests:</strong> Selected healthcare facility or specialist, requested date and time slot, reason for visit, and booking status history.</li>
          <li><strong>Technical & Session Telemetry:</strong> Anonymized request timestamps, device user-agent headers, and authentication security logs.</li>
        </ul>
      </LegalSection>

      <LegalSection id="purposes-of-processing" number={3} heading="Purposes of Processing">
        <p>We process your data exclusively for genuine platform operations:</p>
        <ul>
          <li>To authenticate your session and prevent unauthorized account access.</li>
          <li>To calculate driving distance and travel times to nearby verified hospitals and medical facilities.</li>
          <li>To transmit your emergency incident coordinates and medical badges to your designated emergency contacts upon active SOS trigger.</li>
          <li>To maintain your private appointment planner and consultation calendar within your patient portal.</li>
          <li>To reflect authenticated wearable telemetry (such as resting heart rate or step count) when connected via Google Health API.</li>
        </ul>
      </LegalSection>

      <LegalSection id="location-data" number={4} heading="Location Data & Real-Time Permissions">
        <p>
          Location data is accessed strictly through the standard W3C Geolocation API in your browser after you grant explicit device permission.
        </p>
        <ul>
          <li><strong>Hospital Discovery:</strong> Coordinates are used client-side or sent ephemerally to directory endpoints to compute distances to nearby facilities. We do not track your location in the background when the application is closed.</li>
          <li><strong>Emergency Incident Recording:</strong> When you press the SOS button, your latitude and longitude at that moment are recorded in your private emergency incident record in Supabase to assist first responders and designated emergency contacts.</li>
          <li><strong>Permission Revocation:</strong> You can revoke location access at any time through your browser or device operating system settings.</li>
        </ul>
      </LegalSection>

      <LegalSection id="emergency-sos-data" number={5} heading="Emergency Beacon & Contact Data">
        <p>
          When an SOS emergency beacon is initiated, an incident row is created in the secure database. If you have configured emergency
          contacts, our platform prepares notifications containing your name, incident timestamp, and a map link to your location.
        </p>
        <p>
          <em>Important Limitation:</em> SOS Healthcare is a software communication and assistance tool. Triggering an SOS beacon broadcasts
          your status to designated recipients within the platform, but does not guarantee automatic ambulance dispatch or official 911/112
          PSAP ingestion unless verified operational dispatch integrations are explicitly established in your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="private-appointment-requests" number={6} heading="Private Custom Appointment Requests">
        <LegalNotice variant="info" title="Strict Data Isolation">
          Private custom appointment requests created on hospital cards remain entirely within the SOS Healthcare Supabase project.
          They are NOT automatically transmitted to external hospital electronic health record (EHR) systems, hospital internal databases,
          or external third-party booking APIs.
        </LegalNotice>
        <p>
          The appointment planner functions as a personal, patient-owned consultation log. Status indicators (such as PENDING, CONFIRMED,
          or CANCELLED) reflect records within your SOS Healthcare account. Rescheduling or cancelling a request modifies your private record
          and does not cancel appointments with external medical facilities.
        </p>
      </LegalSection>

      <LegalSection id="google-health-wearables" number={7} heading="Google Health & Wearable Integrations">
        <p>
          When you connect Google Health or compatible fitness tracking services, our application uses the official Google OAuth 2.0 Web
          Application flow:
        </p>
        <ul>
          <li><strong>Requested Permissions:</strong> Read-only access to fitness and health metrics (heart rate, sleep, steps, and activity) requested via standard Google Health API scopes.</li>
          <li><strong>Usage & Storage:</strong> OAuth tokens are encrypted at rest. Telemetry data is queried on-demand to display device status indicators in your dashboard.</li>
          <li><strong>Sharing:</strong> Google Health telemetry is never sold, leased, or shared with third-party advertisers or data brokers.</li>
          <li><strong>Revocation:</strong> You can disconnect your Google Health account at any time in the Devices module or directly via Google Account Security settings (<a href="https://myaccount.google.com/permissions">https://myaccount.google.com/permissions</a>).</li>
          <li><strong>Deletion:</strong> Disconnecting immediately purges stored OAuth tokens and cached readings from the application database.</li>
        </ul>
      </LegalSection>

      <LegalSection id="lawful-basis-consent" number={8} heading="Lawful Basis & Explicit Consent">
        <p>
          We process personal data based on contractual necessity (to deliver the services requested), legitimate interests (maintaining
          application security), and explicit, freely given user consent for sensitive health records and real-time location tracking.
          You retain the right to withdraw consent at any time without affecting lawful processing conducted prior to withdrawal.
        </p>
      </LegalSection>

      <LegalSection id="data-sharing-recipients" number={9} heading="Data Sharing & Authorized Recipients">
        <p>We do not sell, rent, or monetize your health or personal data. Data is shared exclusively under strict safeguards:</p>
        <ul>
          <li><strong>With Your Designated Contacts:</strong> When you initiate an emergency beacon, notification details are sent to contacts you explicitly added.</li>
          <li><strong>With Verified Attending Doctors:</strong> Medical history badges and vital signs are visible to accredited physicians only when you check in to a scheduled consultation or authorize sharing in your health profile.</li>
          <li><strong>Under Legal Obligation:</strong> Where required by valid judicial order, subpoena, or applicable statutory authority.</li>
        </ul>
      </LegalSection>

      <LegalSection id="third-party-infrastructure" number={10} heading="Third-Party Infrastructure & Subprocessors">
        <p>SOS Healthcare relies on enterprise infrastructure providers adhering to stringent data protection standards:</p>
        <ul>
          <li><strong>Supabase Inc.:</strong> Managed PostgreSQL database, authentication engine, and Row-Level Security enforcement.</li>
          <li><strong>Vercel Inc.:</strong> Application edge hosting, static asset delivery, and SSL/TLS termination.</li>
          <li><strong>Google Cloud Platform:</strong> OAuth 2.0 authentication endpoints and Google Maps API services for hospital directory navigation.</li>
        </ul>
      </LegalSection>

      <LegalSection id="security-safeguards" number={11} heading="Security Controls Implemented">
        <p>We employ multi-layered technical and administrative security controls:</p>
        <ul>
          <li>PostgreSQL Row-Level Security (RLS) guaranteeing that patients can query only their own profile, emergency, and appointment records.</li>
          <li>Cryptographic password hashing and standard token exchange via Supabase Auth.</li>
          <li>Mandatory TLS 1.3 encryption in transit for all web and API traffic.</li>
          <li>Content Security Policy (CSP) and HTTP security headers preventing unauthorized code injection and cross-site scripting (XSS).</li>
        </ul>
      </LegalSection>

      <LegalSection id="data-retention" number={12} heading="Data Retention & Minimization">
        <p>
          We retain personal data only for as long as your account remains active or as required to maintain your healthcare assistance history.
          Emergency incident records and custom appointment entries are retained within your account until you initiate an account closure
          or request record deletion.
        </p>
      </LegalSection>

      <LegalSection id="user-rights" number={13} heading="User Rights, Revocation & Deletion">
        <p>You maintain full control over your personal data, including the right to:</p>
        <ul>
          <li>Access and inspect all personal data and medical entries associated with your account.</li>
          <li>Rectify incomplete or inaccurate clinical measurements in your health profile.</li>
          <li>Export your emergency contacts, appointments, and vitals in machine-readable JSON format.</li>
          <li>Request permanent deletion of your account and associated database records.</li>
        </ul>
        <p>
          To exercise your rights, submit a request via our <a href="/contact">Contact Page</a> or email our administrative privacy desk.
        </p>
      </LegalSection>

      <LegalSection id="cross-border-transfers" number={14} heading="Cross-Border Data Processing">
        <p>
          SOS Healthcare cloud infrastructure is hosted in secured regional data centers. If you access the platform from outside the host
          jurisdiction, your data is transferred and processed securely using standardized contractual protections and encrypted transport protocols.
        </p>
      </LegalSection>

      <LegalSection id="childrens-privacy" number={15} heading="Children's Privacy">
        <p>
          SOS Healthcare is not directed at children under the age of 16 without parental or legal guardian supervision. We do not knowingly
          collect personal information directly from unassisted minors. If you believe a child has created an account without parental consent,
          please notify us immediately for prompt record removal.
        </p>
      </LegalSection>

      <LegalSection id="cookies-technical" number={16} heading="Cookies, Sessions & Local Storage">
        <p>
          We use strictly necessary first-party cookies and local storage tokens to manage authenticated user sessions and remember your selected
          display language across browser reloads. We do not utilize third-party cross-site advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection id="policy-changes" number={17} heading="Policy Modifications & Version History">
        <p>
          We may update this Privacy Policy to reflect enhancements in platform security, regulatory requirements, or new features. When updates
          occur, the &quot;Last Updated&quot; date at the top of this document will be revised. Substantial modifications will be announced via
          in-app notification.
        </p>
      </LegalSection>

      <LegalSection id="privacy-contact" number={18} heading="Privacy Enquiries & Operator Contact">
        <p>
          For questions, privacy enquiries, or data access requests regarding SOS Healthcare:
        </p>
        <ul>
          <li><strong>Platform:</strong> SOS Healthcare Project Administration</li>
          <li><strong>Public Web:</strong> <a href="https://sos-healthcare.vercel.app">https://sos-healthcare.vercel.app</a></li>
          <li><strong>Privacy Request Desk:</strong> Accessible via our verified <a href="/contact">Public Contact Portal</a></li>
          <li><strong>Administrative Inquiries:</strong> <a href="mailto:admin@sos-healthcare.vercel.app">admin@sos-healthcare.vercel.app</a> (or via configured domain contact)</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <em>Publication Note:</em> Formal legal compliance certification across international jurisdictions remains subject to independent legal review.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
