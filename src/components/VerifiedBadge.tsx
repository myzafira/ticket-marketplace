"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function VerifiedBadge() {
  const { t } = useTranslation();

  return (
    <span
      title={t("trust.verifiedTooltip")}
      className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path
          fillRule="evenodd"
          d="M10 1.5a1 1 0 01.577.183l1.65 1.15 2.006-.223a1 1 0 01.99.51l1.007 1.756 1.756 1.006a1 1 0 01.51.99l-.223 2.007 1.15 1.65a1 1 0 010 1.154l-1.15 1.65.223 2.006a1 1 0 01-.51.99l-1.756 1.007-1.006 1.756a1 1 0 01-.99.51l-2.007-.223-1.65 1.15a1 1 0 01-1.154 0l-1.65-1.15-2.006.223a1 1 0 01-.99-.51l-1.007-1.756-1.756-1.006a1 1 0 01-.51-.99l.223-2.007-1.15-1.65a1 1 0 010-1.154l1.15-1.65-.223-2.006a1 1 0 01.51-.99l1.756-1.007 1.006-1.756a1 1 0 01.99-.51l2.007.223 1.65-1.15A1 1 0 0110 1.5zm3.196 6.803a.75.75 0 00-1.06-1.06l-3.44 3.44-1.44-1.44a.75.75 0 10-1.06 1.06l1.97 1.97a.75.75 0 001.06 0l3.97-3.97z"
          clipRule="evenodd"
        />
      </svg>
      {t("trust.verifiedBadge")}
    </span>
  );
}
