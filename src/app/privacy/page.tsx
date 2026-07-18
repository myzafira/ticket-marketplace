"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import { legalContent } from "@/lib/legal/content";
import LegalDocPage from "@/components/LegalDocPage";

export default function PrivacyPage() {
  const { locale } = useTranslation();
  return <LegalDocPage doc={legalContent[locale].privacy} />;
}
