"use client";

import { useState } from "react";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { ContactAdminModal } from "@/components/ContactAdminModal";
import { Button } from "@/components/ui/Button";
import { MailIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalContent } from "@/lib/i18n/legal-content";

export default function PrivacyPolicyPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { language } = useLanguage();
  const bundle = getLegalContent(language);
  const content = bundle.privacy;

  const toc = content.sections.map((sec) => ({
    id: sec.id,
    label: sec.heading,
  }));

  return (
    <>
      <LegalLayout
        title={content.title}
        subtitle={content.subtitle}
        lastUpdated={content.lastUpdated}
        toc={toc}
      >
        {content.notice && (
          <LegalNotice variant={content.notice.variant} title={content.notice.title}>
            {content.notice.text}
          </LegalNotice>
        )}

        {content.sections.map((sec) => (
          <LegalSection key={sec.id} id={sec.id} number={sec.number} heading={sec.heading}>
            {sec.notice && (
              <LegalNotice variant={sec.notice.variant} title={sec.notice.title}>
                {sec.notice.text}
              </LegalNotice>
            )}

            {sec.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}

            {sec.bullets && sec.bullets.length > 0 && (
              <ul>
                {sec.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}

            {sec.subparagraphs &&
              sec.subparagraphs.map((sp, idx) => <p key={`sub-${idx}`}>{sp}</p>)}

            {sec.contactEmail && (
              <p className="font-semibold text-gray-900 dark:text-white">
                Administrative Email:{" "}
                <a href={`mailto:${sec.contactEmail}`}>{sec.contactEmail}</a>
              </p>
            )}

            {sec.contactButton && (
              <div className="pt-3">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <MailIcon className="h-4 w-4" />
                  <span>{sec.contactButton}</span>
                </Button>
              </div>
            )}
          </LegalSection>
        ))}
      </LegalLayout>

      <ContactAdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
