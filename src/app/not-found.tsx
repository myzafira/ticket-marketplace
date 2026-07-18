"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-xl font-bold text-gray-900">{t("notFound.title")}</h1>
      <p className="mt-2 text-gray-500">{t("notFound.description")}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
