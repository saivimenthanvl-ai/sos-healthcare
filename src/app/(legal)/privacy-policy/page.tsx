import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Privacy Policy | Fyzer Healthcare Platform",
  description: "How Fyzer collects, uses, stores, protects and discloses information.",
};

const toc = [
  { id: "introduction", label: "Introduction" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "patient-and-medical-data", label: "Patient and Medical Data" },
  { id: "ai-assistant", label: "AI Assistant and Patient Data" },
  { id: "how-we-protect-information", label: "How We Protect Information" },
  { id: "data-sharing", label: "Data Sharing" },
  { id: "data-retention", label: "Data Retention" },
  { id: "user-rights", label: "User Rights" },
  { id: "cookies", label: "Cookies and Technical Information" },
  { id: "third-party-services", label: "Third-Party Services" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Privacy Policy" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Fyzer Healthcare Platform"
      lastUpdated="5 October 2026"
      toc={toc}
    >
      <LegalSection id="introduction" number={1} heading="Introduction">
        <p>
          Fyzer provides digital healthcare services, including patient accounts, appointment
          management, medical information access, healthcare communication and AI-assisted
          healthcare features.
        </p>
        <p>
          This Privacy Policy describes how information is collected, used, stored, protected and
          disclosed when users interact with Fyzer.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" number={2} heading="Information We Collect">
        <p>Fyzer may process the following information:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Date of birth</li>
          <li>Gender</li>
          <li>Patient identifier</li>
          <li>Account/profile information</li>
          <li>Appointment information</li>
          <li>Medical reports</li>
          <li>Laboratory reports</li>
          <li>Diagnostic information</li>
          <li>Medical history</li>
          <li>Uploaded healthcare documents</li>
          <li>Messages sent through the platform</li>
          <li>Device/browser information</li>
          <li>IP address</li>
          <li>Login/security information</li>
          <li>Audit and activity information</li>
        </ul>
        <p>
          Healthcare information may constitute sensitive personal information and is handled
          accordingly.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-information" number={3} heading="How We Use Information">
        <p>Information may be used to:</p>
        <ul>
          <li>Create and manage user accounts</li>
          <li>Authenticate users</li>
          <li>Verify authorized access</li>
          <li>Connect users with their appropriate patient record</li>
          <li>Schedule and manage appointments</li>
          <li>Display authorized medical reports</li>
          <li>Support doctors, technicians and other authorized clinical staff</li>
          <li>Provide healthcare-related communication</li>
          <li>Operate AI-assisted functionality</li>
          <li>Maintain application security</li>
          <li>Prevent unauthorized access</li>
          <li>Maintain audit records</li>
          <li>Improve platform reliability</li>
          <li>Respond to support requests</li>
          <li>Meet applicable legal or regulatory obligations</li>
        </ul>
      </LegalSection>

      <LegalSection id="patient-and-medical-data" number={4} heading="Patient and Medical Data">
        <ul>
          <li>Medical information must only be accessed by authorized users.</li>
          <li>
            Access to protected patient information should depend on authentication,
            authorization, organizational access, role/capability and other applicable
            access-control rules.
          </li>
          <li>
            Users should only access medical information they are legally and operationally
            authorized to access.
          </li>
          <li>Fyzer must not present the AI assistant as the clinical source of truth.</li>
          <li>
            Official patient records stored by authorized clinical systems remain the authoritative
            medical record.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ai-assistant" number={5} heading="AI Assistant and Patient Data">
        <p>
          Fyzer may provide AI-assisted features to help users understand information, navigate the
          platform and interact with healthcare services. The AI assistant:
        </p>
        <ul>
          <li>is not a replacement for a licensed healthcare professional;</li>
          <li>should not independently provide a definitive medical diagnosis;</li>
          <li>should not independently prescribe treatment or medication;</li>
          <li>
            should only receive protected patient information after required authorization checks
            have succeeded;
          </li>
          <li>may generate incorrect, incomplete or outdated information;</li>
          <li>should escalate appropriate clinical situations to qualified healthcare professionals.</li>
        </ul>
        <LegalNotice variant="warning" title="Medical emergencies">
          Do not use the Fyzer AI assistant for medical emergencies. If you believe you are
          experiencing a medical emergency, immediately contact your local emergency medical
          service or go to the nearest emergency department.
        </LegalNotice>
      </LegalSection>

      <LegalSection id="how-we-protect-information" number={6} heading="How We Protect Information">
        <p>
          Appropriate technical and organizational safeguards may include:
        </p>
        <ul>
          <li>Authentication</li>
          <li>Role-based/capability-based authorization</li>
          <li>Secure network communication</li>
          <li>Encryption where applicable</li>
          <li>Session security</li>
          <li>Access controls</li>
          <li>Audit logging</li>
          <li>Monitoring</li>
          <li>Restricted administrative access</li>
        </ul>
        <p>
          No system can be guaranteed to be completely secure. These measures reduce risk but
          cannot eliminate it.
        </p>
      </LegalSection>

      <LegalSection id="data-sharing" number={7} heading="Data Sharing">
        <p>Information should only be shared where necessary with:</p>
        <ul>
          <li>Authorized healthcare professionals</li>
          <li>Clinical service providers</li>
          <li>Hospitals or healthcare organizations involved in patient care</li>
          <li>Infrastructure/service providers required to operate Fyzer</li>
          <li>Government or regulatory authorities when legally required</li>
        </ul>
        <p>Access should be limited to what is necessary for the permitted purpose.</p>
      </LegalSection>

      <LegalSection id="data-retention" number={8} heading="Data Retention">
        <p>Information may be retained for as long as necessary to:</p>
        <ul>
          <li>provide healthcare services;</li>
          <li>maintain medical/business records;</li>
          <li>meet contractual requirements;</li>
          <li>meet applicable healthcare/legal requirements;</li>
          <li>maintain security and audit records.</li>
        </ul>
      </LegalSection>

      <LegalSection id="user-rights" number={9} heading="User Rights">
        <p>
          Subject to applicable law and healthcare record-retention requirements, users may be able
          to request:
        </p>
        <ul>
          <li>Access to personal information</li>
          <li>Correction of inaccurate information</li>
          <li>Updating personal information</li>
          <li>Deletion where legally permitted</li>
          <li>Withdrawal of applicable consent</li>
          <li>Information about how their data is being processed</li>
        </ul>
        <p>
          To make a request, contact <a href="mailto:admin@fyzer.com">admin@fyzer.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number={10} heading="Cookies and Technical Information">
        <p>
          The website may use necessary cookies, local storage or session storage for:
        </p>
        <ul>
          <li>Authentication</li>
          <li>Session management</li>
          <li>Preferences</li>
          <li>Security</li>
          <li>Application functionality</li>
          <li>Analytics, if analytics are enabled</li>
        </ul>
      </LegalSection>

      <LegalSection id="third-party-services" number={11} heading="Third-Party Services">
        <p>
          Fyzer may integrate with external healthcare, infrastructure or technical services.
          External services have their own privacy practices, which are separate from this policy.
        </p>
      </LegalSection>

      <LegalSection id="childrens-privacy" number={12} heading="Children's Privacy">
        <p>
          Where the platform supports minors, access and data handling must occur through an
          authorized parent, guardian or legally permitted representative where required.
        </p>
      </LegalSection>

      <LegalSection id="changes" number={13} heading="Changes to This Privacy Policy">
        <p>
          Fyzer may update this policy as its services, technologies or legal requirements change.
          The latest effective date is shown at the top of this page.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={14} heading="Contact">
        <address className="not-italic leading-relaxed">
          <strong className="text-gray-900 dark:text-white">Fyzer</strong>
          <br />
          Privacy &amp; Administrative Support
          <br />
          Email: <a href="mailto:admin@fyzer.com">admin@fyzer.com</a>
        </address>
      </LegalSection>
    </LegalLayout>
  );
}
