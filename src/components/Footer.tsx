"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type Contact = {
  lineId: string | null;
  instagramId: string | null;
  phoneNumber: string | null;
};

export default function Footer() {
  const { t } = useTranslation();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetch("/api/settings/contact")
      .then((res) => res.json())
      .then(setContact)
      .catch(() => {});
  }, []);

  const hasContact =
    contact && (contact.lineId || contact.instagramId || contact.phoneNumber);

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
        {hasContact && (
          <>
            <p className="mb-2 font-medium text-gray-700">{t("footer.contactTitle")}</p>
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1">
              {contact.lineId && (
                <span>
                  {t("footer.line")}: {contact.lineId}
                </span>
              )}
              {contact.instagramId && (
                <span>
                  {t("footer.instagram")}: {contact.instagramId}
                </span>
              )}
              {contact.phoneNumber && (
                <span>
                  {t("footer.tel")}: {contact.phoneNumber}
                </span>
              )}
            </div>
          </>
        )}
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${
            hasContact ? "border-t pt-4" : ""
          }`}
        >
          <Link href="/terms" className="hover:text-gray-700 hover:underline">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 hover:underline">
            {t("footer.privacy")}
          </Link>
          <span className="text-gray-400">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}
