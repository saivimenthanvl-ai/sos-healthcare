import { LegalPage, Section } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service & Patient Care Agreement" updated="October 2026">
      <div className="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        
        {/* Critical Emergency Banner */}
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-900 dark:text-red-200">
          <p className="font-bold text-base mb-1">🚨 Emergency Protocol & Critical Life Safety Notice</p>
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-300">
            If a patient is unconscious, unresponsive, severely bleeding, in respiratory failure, or experiencing suspected cardiac arrest, call your national emergency helpline (<strong>911 / 112</strong>) immediately. While SOS Healthcare mobilizes ambulances and notifies nearest hospitals, direct telephone emergency services must be engaged simultaneously.
          </p>
        </div>

        <Section heading="1. Agreement & Acceptance of Terms">
          <p>
            These Terms of Service (“Terms”) constitute a binding legal agreement between you (“Patient”, “User”, or “Guardian”) and SOS Healthcare (“SOS Healthcare”, “we”, or “Platform”).
          </p>
          <p>
            By accessing or using our website, dispatch console, mobile application, hospital bed booking tool, or wearable integration endpoints, you acknowledge and agree to comply with all terms set forth herein. If you do not agree with any part of these Terms, you must discontinue use immediately.
          </p>
        </Section>

        <Section heading="2. Scope of Healthcare Platform & Emergency Dispatch Services">
          <p>
            SOS Healthcare operates as an autonomous digital emergency coordination network that facilitates:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Proximity Hospital Matching:</strong> Real-time mapping of accredited hospitals, ER bed availability, ICU capacity, and direct route navigation.</li>
            <li><strong>Ambulance Fleet Dispatch:</strong> Telemetry-based dispatch of the nearest licensed paramedic units with targeted response times of 10–20 minutes.</li>
            <li><strong>Wearable Biometrics & Fall Alerts:</strong> Telemetry synchronization with smartwatches (Fitbit, Apple Watch, Wear OS) for automatic emergency beacon activation.</li>
            <li><strong>Customized Hospital Admissions:</strong> Digital advance notification and reservation of hospital ER/ICU beds tailored to patient triage needs.</li>
            <li><strong>Emergency Contact Redirection:</strong> Automated SMS and webhook broadcast of patient GPS coordinates and hospital directions to designated family contacts.</li>
          </ul>
        </Section>

        <Section heading="3. Patient Responsibilities & Clinical Accuracy">
          <p>As a patient, user, or guardian utilizing the Platform, you undertake and agree that:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Accuracy of Medical Information:</strong> You are responsible for ensuring that all medical conditions, blood groups, known allergies, and current medications entered on your profile are truthful, accurate, and current.</li>
            <li><strong>Authorized Third-Party Triggers:</strong> If you trigger an emergency beacon on behalf of a minor, dependent, or incapacitated individual, you represent that you are acting in good faith for their immediate preservation of life.</li>
            <li><strong>Location Permissions:</strong> You must ensure device GPS permissions are granted to enable accurate ambulance dispatch and hospital routing.</li>
            <li><strong>Emergency Contact Consent:</strong> You have obtained consent from designated individuals before listing them as emergency contacts.</li>
          </ul>
        </Section>

        <Section heading="4. Free Emergency Access & Zero User Fees">
          <p>
            Emergency dispatch coordination, hospital proximity search, and emergency contact broadcasts via SOS Healthcare are provided completely free of charge to users. No subscription fees, paywalls, or hidden charges are levied on patients for utilizing the emergency SOS beacon. Hospital treatment, inpatient procedures, and ambulance transport charges remain governed by the respective healthcare facility or ambulance operator according to standard medical guidelines and applicable insurance coverage.
          </p>
        </Section>

        <Section heading="5. Response Times & External Variables">
          <p>
            While SOS Healthcare operates with a targeted ambulance arrival window of 10–20 minutes, response times are subject to dynamic real-world variables beyond software control, including prevailing traffic density, severe weather conditions, municipal road access, geographical proximity, and local hospital emergency department bed capacity. SOS Healthcare and participating hospitals exert every reasonable clinical effort to achieve rapid arrival.
          </p>
        </Section>

        <Section heading="6. Relationship Between Patient, Hospitals & Paramedics">
          <p>
            SOS Healthcare facilitates rapid technological coordination between patients, independent accredited hospitals, and licensed paramedic operators. Clinical diagnoses, medical interventions, prescription decisions, and inpatient care provided by hospital physicians or first responders remain the sole professional responsibility of those respective certified practitioners.
          </p>
        </Section>

        <Section heading="7. Acceptable Use & Prohibition of False Alarms">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Trigger false, frivolous, or prank emergency SOS alerts that divert life-saving paramedic fleets away from genuine medical emergencies.</li>
            <li>Reverse-engineer, tamper with, or disrupt emergency telemetry, dispatch algorithms, or server infrastructure.</li>
            <li>Impersonate healthcare providers, dispatchers, or paramedics.</li>
            <li>Misuse or harvest hospital capacity data for unauthorized commercial purposes.</li>
          </ul>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">
            *Deliberate false emergency activations that endanger public safety are subject to immediate account termination and reporting to relevant civil authorities.
          </p>
        </Section>

        <Section heading="8. Limitation of Liability & Medical Indemnity">
          <p>
            To the maximum extent permitted by applicable law, SOS Healthcare shall not be liable for indirect, incidental, or consequential damages resulting from technical network outages, cellular carrier failures, or third-party GPS signal degradations during emergency response. Nothing in these Terms shall limit or diminish any statutory rights granted to patients under medical consumer protection regulations.
          </p>
        </Section>

        <Section heading="9. Modifications & Governing Law">
          <p>
            We may revise these Terms periodically to reflect evolving clinical protocols and regulatory guidelines. Any disputes arising from or relating to the use of SOS Healthcare services shall be subject to the applicable laws and competent judicial jurisdiction.
          </p>
        </Section>

        <Section heading="10. Contacting SOS Healthcare Legal & Support">
          <p>
            For questions or legal correspondence regarding these Terms of Service:
          </p>
          <p className="mt-2 font-medium">
            SOS Healthcare Legal & Clinical Compliance Department<br />
            Email: <a href="mailto:legal@sos-healthcare.app" className="text-blue-600 dark:text-blue-400 hover:underline">legal@sos-healthcare.app</a><br />
            24/7 Operations Support: Emergency Operations Center
          </p>
        </Section>

      </div>
    </LegalPage>
  );
}