import { LegalPage, Section } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Patient Privacy Policy & Clinical Data Protection" updated="October 2026">
      <div className="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        
        {/* Important Banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-200">
          <p className="font-semibold text-base mb-1">Our Commitment to Patient Privacy & Clinical Confidentiality</p>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            SOS Healthcare adheres to global medical privacy principles, NABH patient dignity benchmarks, and Digital Personal Data Protection standards. Your medical conditions, vital telemetry, and GPS emergency beacons are handled with strict clinical confidentiality.
          </p>
        </div>

        <Section heading="1. Scope & Healthcare Application">
          <p>
            This Patient Privacy Policy applies to all patients, guardians, emergency contacts, paramedics, and healthcare professionals accessing or utilizing the SOS Healthcare emergency coordination network, mobile applications, hospital admission consoles, and connected wearable APIs (collectively, the “Platform”).
          </p>
          <p>
            SOS Healthcare acts as a trusted emergency data custodian connecting patients with accredited hospitals, emergency departments, and licensed ambulance paramedic crews.
          </p>
        </Section>

        <Section heading="2. Categories of Patient & Clinical Data Collected">
          <p>To provide rapid triage, ambulance dispatch, and hospital bed reservation, we collect and process the following categories of data:</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">A. Personal & Identification Data</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                <li>Full patient legal name, date of birth, and gender.</li>
                <li>Verified mobile phone number and primary email address.</li>
                <li>Residential and current physical location address.</li>
                <li>Pre-registered emergency contacts (names, relationships, numbers).</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">B. Sensitive Health & Clinical Data</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                <li>Blood type, drug allergies, and medical implants.</li>
                <li>Pre-existing chronic conditions (e.g., cardiac, respiratory, diabetes).</li>
                <li>Active prescriptions, medications, and triage symptoms.</li>
                <li>Emergency doctor and paramedic clinical consultation notes.</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">C. Real-Time Telemetry & Wearables</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                <li>Continuous GPS coordinates, reverse-geocoded landmarks, and speed.</li>
                <li>Smartwatch heart rate readings (BPM) and sudden arrhythmia alerts.</li>
                <li>Automated accelerometer fall-detection signals (Fitbit, Apple Watch, Wear OS).</li>
                <li>Live transit heading and ETA tracking to designated hospital emergency rooms.</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">D. Hospital & Admission Logs</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm">
                <li>Customized bed reservation requests (ICU, ER, CCU, Pediatric).</li>
                <li>Hospital triage priority scores and doctor assignments.</li>
                <li>Ambulance vehicle identification and dispatch logs.</li>
                <li>Emergency incident timestamps and resolution records.</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section heading="3. Clinical & Operational Purposes of Processing">
          <p>Patient data is utilized strictly for direct patient care, life preservation, and emergency response:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Automated Emergency Response:</strong> Pairing your exact GPS location with the nearest licensed ambulance and hospital equipped with suitable bed availability.</li>
            <li><strong>Paramedic Pre-Arrival Briefing:</strong> Providing incoming first responders with vital health data (such as severe drug allergies, heart rate trends, and blood group) before reaching the incident scene.</li>
            <li><strong>Emergency Contact Broadcast:</strong> Automatically transmitting SMS and web alerts containing Google Maps redirection links to your chosen family contacts.</li>
            <li><strong>Hospital ER Preparation:</strong> Alerting hospital trauma centers in advance of arrival so surgical theaters and ICU teams can prep life support resources.</li>
            <li><strong>Zero Advertising & Non-Monetization:</strong> SOS Healthcare never sells, trades, licenses, or shares patient health or telemetry data with third-party advertising or marketing brokers.</li>
          </ul>
        </Section>

        <Section heading="4. Sharing & Disclosure of Patient Information">
          <p>We share patient data exclusively with authorized entities under strict confidentiality agreements:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Treating Hospitals & Emergency Departments:</strong> Clinical staff, doctors, and triage nurses assigned to manage your emergency admission.</li>
            <li><strong>Dispatched Paramedic Crews:</strong> Licensed first responders providing immediate in-transit resuscitation and medical stabilization.</li>
            <li><strong>Designated Emergency Contacts:</strong> Pre-registered relatives or guardians receiving your incident coordinates.</li>
            <li><strong>Statutory Authorities:</strong> Certified law enforcement, public health bodies, or disaster authorities where required by mandatory legal statutory reporting.</li>
          </ul>
        </Section>

        <Section heading="5. Data Security, Encryption & Integrity">
          <p>
            We implement comprehensive organizational and technical security measures matching premier hospital benchmarks:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Encryption Standards:</strong> TLS 1.3 encryption for all data in transit and AES-256 encryption at rest for databases and backups.</li>
            <li><strong>Row-Level Security (RLS):</strong> Cryptographically isolated tenant profiles preventing unauthorized access between users.</li>
            <li><strong>Audit Logging:</strong> Immutable timestamped logs recording every clinical access to patient emergency files.</li>
            <li><strong>Paramedic Privilege Separation:</strong> Field crews access health records exclusively during active assigned incidents.</li>
          </ul>
        </Section>

        <Section heading="6. Patient Rights & Data Sovereignty">
          <p>As a patient or registered user, you retain complete sovereignty over your information:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Right to Access & Portability:</strong> View and export your health profile, incident history, and emergency contact list.</li>
            <li><strong>Right to Rectification:</strong> Edit, update, or append medical history, allergy alerts, and prescription notes at any time.</li>
            <li><strong>Right to Erasure & Disconnection:</strong> Disconnect smartwatches, revoke location access, or delete your account permanently.</li>
            <li><strong>Right to Withdraw Consent:</strong> Remove consent for non-emergency analytics without affecting your access to emergency care.</li>
          </ul>
        </Section>

        <Section heading="7. Data Retention Policy">
          <p>
            Clinical incident records and emergency admission logs are retained in accordance with statutory hospital record retention guidelines and the Digital Personal Data Protection Act. Inactive accounts can be removed at the patient's request, leaving only anonymized statistics necessary for municipal dispatch performance audits.
          </p>
        </Section>

        <Section heading="8. Grievance Officer & Patient Rights Desk">
          <p>
            For patient privacy inquiries, data requests, or clinical confidentiality concerns, contact our dedicated Data Protection Officer:
          </p>
          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="font-bold text-gray-900 dark:text-white">SOS Healthcare Data Protection & Patient Rights Office</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
              Email: <a href="mailto:dpo@sos-healthcare.app" className="text-blue-600 dark:text-blue-400 hover:underline">dpo@sos-healthcare.app</a><br />
              Emergency Operations Desk: 24/7 Clinical Coordination Network<br />
              Location: Emergency Healthcare Operations Center
            </p>
          </div>
        </Section>

      </div>
    </LegalPage>
  );
}