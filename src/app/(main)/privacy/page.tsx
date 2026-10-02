import { LegalPage, Section } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <Section heading="What we collect">
        <p>
          We store your account details (email, full name, phone), the medical
          information you choose to save (allergies, blood type, medical
          conditions), your emergency contacts, and the location and vital-sign
          readings produced while an emergency is active.
        </p>
        <p>
          If you connect a wearable such as a Fitbit, we store its access and
          refresh tokens so we can read heart rate, step count and location on
          your behalf. You can disconnect it at any time from your profile.
        </p>
      </Section>

      <Section heading="How we use it">
        <p>
          Location and health data are used to dispatch the nearest ambulance,
          route it to you, and give the responding crew the information they need
          to treat you. We do not sell your data or use it for advertising.
        </p>
        <p>
          Live vitals and location are shared with responding crews and the
          dispatch console only while an emergency is active.
        </p>
      </Section>

      <Section heading="Who can see your data">
        <p>
          You can see your own records. Dispatchers and paramedics can see
          emergency records while responding. Ambulance and hospital records are
          visible to everyone using the app, because the service depends on
          knowing where nearby capacity exists.
        </p>
        <p>
          Your profile, including your medical details, is not visible to other
          users.
        </p>
      </Section>

      <Section heading="Retention">
        <p>
          We keep your emergency history so you can review past incidents. You
          can delete your account at any time, which removes your profile,
          contacts and location history.
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          We use Supabase for database and authentication, and Google Maps for
          geocoding and mapping. Each of those processors receives only the data
          needed to perform its function.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy can go to the contact page. For a medical
          emergency, do not use this form — call your local emergency number.
        </p>
      </Section>
    </LegalPage>
  );
}