import { LegalPage, Section } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy & Terms of Service" updated="October 2026">
      <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <Section heading="1. General & Overview">
          <p>
            SOS Healthcare (“SOS Healthcare”, “we”, “us”, or “our”) provides mission-critical emergency healthcare dispatch, nearest hospital routing, ambulance tracking, and wearable vital telemetry services to individuals accessing or using our web platform, mobile applications, or connected APIs (collectively, the “Platform”).
          </p>
          <p>
            Any accessing or browsing of the Platform and using the Services indicates your acceptance of this Privacy Policy and Terms. If you disagree with any part of these terms, you may discontinue access or use of the Platform.
          </p>
        </Section>

        <Section heading="2. Eligibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You are at least 18 years old or accessing the Platform under the direct supervision of a parent or legal guardian.</li>
            <li>In life-critical circumstances, any person or first responder can trigger emergency beacon assistance on behalf of an incapacitated patient.</li>
            <li>You are legally competent to contract and receive emergency healthcare services.</li>
          </ul>
        </Section>

        <Section heading="3. What Types of Data We Collect">
          <p>
            We collect personal, diagnostic, telemetry, and location data solely to facilitate life-saving intervention and hospital coordination:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Personal & Contact Information:</strong> Name, verified telephone number, email address, and home address.</li>
            <li><strong>Emergency Contacts:</strong> Designee names, relationship, and contact numbers notified automatically during SOS triggers.</li>
            <li><strong>Real-time Location & GPS Telemetry:</strong> Precise device coordinates, reverse-geocoded addresses, and heading data during active dispatch.</li>
            <li><strong>Smartwatch & Wearable Biometrics:</strong> Heart rate (BPM), heart rate variability, accelerometer fall-detection signals, and step activity synced from connected devices (Fitbit, Apple Watch, Wear OS).</li>
            <li><strong>Critical Health Profile:</strong> Blood group, known drug allergies, pre-existing chronic conditions, and emergency medical notes uploaded voluntarily to inform paramedic first responders.</li>
            <li><strong>Hospital & Dispatch Logs:</strong> Incident timestamps, assigned ambulance IDs, and triage bed reservation requests.</li>
          </ul>
        </Section>

        <Section heading="4. Purpose & How We Use Your Data">
          <p>Your information is collected and processed strictly for legitimate healthcare and dispatch objectives:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Nearest Emergency Routing:</strong> Calculating proximity and real-time travel ETAs to the closest hospital ER and available ambulance fleet using Google Maps APIs.</li>
            <li><strong>Emergency Contact Alerts:</strong> Automatically dispatching SMS and webhook notifications with live GPS links to your designated emergency contacts upon SOS activation.</li>
            <li><strong>Paramedic & Hospital Pre-Briefing:</strong> Securely streaming essential medical data (allergies, heart rate, condition) to arriving medical staff to expedite clinical triage.</li>
            <li><strong>Zero Advertising & Data Monetization:</strong> We never sell, monetize, rent, or lease your medical, biometric, or location data to commercial advertisers or third-party data brokers.</li>
          </ul>
        </Section>

        <Section heading="5. Disclosure & Sharing of Health Data">
          <p>We share and disclose data only to the minimum extent necessary to provide emergency relief:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Accredited Healthcare Service Providers:</strong> Verified hospitals, emergency departments, trauma centers, and licensed paramedics assigned to your incident.</li>
            <li><strong>Designated Emergency Contacts:</strong> Contacts explicitly configured in your profile emergency list.</li>
            <li><strong>Infrastructure & Technology Processors:</strong> HIPAA/SOC-compliant hosting, Supabase encrypted databases, and Google Maps Geocoding APIs under strict confidentiality covenants.</li>
            <li><strong>Law Enforcement & Public Safety:</strong> Only when mandated under court orders or statutory disaster relief requirements.</li>
          </ul>
        </Section>

        <Section heading="6. Data Security & Storage Safeguards">
          <p>
            SOS Healthcare employs state-of-the-art security practices, including End-to-End TLS encryption in transit, AES-256 encryption at rest, Row-Level Security (RLS) on personal records, and role-based access restricted solely to active dispatchers and treating paramedics.
          </p>
        </Section>

        <Section heading="7. User Rights & Data Retention">
          <p>
            You hold complete control over your health profile. You may update, correct, or permanently delete your account, saved contacts, and wearable integrations directly from your Settings or Profile console at any time. Non-identifiable de-identified emergency logs may be maintained for statistical service reliability and auditing.
          </p>
        </Section>

        <Section heading="8. Emergency Protocol Disclaimer">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-800 dark:text-red-200">
            <strong>Critical Medical Notice:</strong> SOS Healthcare is an automated emergency routing and coordination platform. If you or someone near you is in immediate, severe life danger or unconscious, dial your local emergency phone number (<strong>911 / 112</strong>) immediately while the platform coordinates assistance.
          </div>
        </Section>

        <Section heading="9. Grievance Officer & Contact">
          <p>
            For privacy inquiries, data subject access requests, or policy feedback, contact our Data Protection Office at:
          </p>
          <p className="mt-2 font-medium">
            SOS Healthcare Privacy & Grievance Cell<br />
            Email: <a href="mailto:privacy@sos-healthcare.app" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@sos-healthcare.app</a><br />
            Emergency Hotline: 24/7 Operations Desk
          </p>
        </Section>
      </div>
    </LegalPage>
  );
}