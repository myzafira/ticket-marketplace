"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center rounded-full border bg-gray-50 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLocale("th")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "th"
            ? "bg-indigo-600 text-white"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2 py-1 transition ${
          locale === "en"
            ? "bg-indigo-600 text-white"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        EN
      </button>
    </div>
  );
}
