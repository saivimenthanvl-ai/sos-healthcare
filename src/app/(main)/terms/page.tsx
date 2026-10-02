import { LegalPage, Section } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <Section heading="This is not an emergency service">
        <p>
          SOS Healthcare is a software platform. It assists with locating
          hospitals and coordinating ambulance dispatch, but it does not
          replace emergency medical services.
        </p>
        <p className="font-medium text-red-700">
          If you are in immediate danger, call your local emergency number
          first. Do not wait for this app.
        </p>
      </Section>

      <Section heading="No guarantee of response time">
        <p>
          The 10-20 minute target shown in the app is a service goal, not a
          commitment. Response times depend on your location, ambulance
          availability, road conditions and hospital capacity, none of which
          this platform controls.
        </p>
      </Section>

      <Section heading="Accuracy of information">
        <p>
          Hospital, ambulance and location information is provided in good
          faith and may be out of date. Do not rely on this app as the only
          source for a hospital&apos;s capabilities or a crew&apos;s
          availability.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          You are responsible for keeping your sign-in details secure and for the
          accuracy of the medical information you enter. Emergency contacts you
          add must consent to being contacted.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>
          Do not use the platform to raise false emergencies, to obtain medical
          advice, or to interfere with a genuine dispatch. Repeated false
          activations may lead to your account being suspended.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          The service is provided as-is. To the extent permitted by law we are
          not liable for indirect or consequential loss arising from its use.
          Nothing here limits your rights as a patient seeking emergency care.
        </p>
      </Section>
    </LegalPage>
  );
}