"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { RatingSummary } from "@/lib/types";

export default function StarRating({
  summary,
  size = "sm",
}: {
  summary: RatingSummary;
  size?: "sm" | "md";
}) {
  const { t } = useTranslation();
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (summary.count === 0) {
    return (
      <span className={`${textSize} text-gray-400`}>
        {t("starRating.noReviewsYet")}
      </span>
    );
  }

  const rounded = Math.round(summary.average ?? 0);
  return (
    <span className={`${textSize} text-gray-600`}>
      <span className="text-amber-500" aria-hidden>
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>{" "}
      {summary.average?.toFixed(1)} ({summary.count})
    </span>
  );
}
