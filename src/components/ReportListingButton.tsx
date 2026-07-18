"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import type { MyReport } from "@/lib/types";

export default function ReportListingButton({
  listingId,
  myReport,
  onReported,
}: {
  listingId: string;
  myReport: MyReport | undefined;
  onReported: (report: { id: string; status: "OPEN" | "RESOLVED" }) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (myReport) {
    return (
      <span
        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
          myReport.status === "OPEN"
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {myReport.status === "OPEN"
          ? t("reportListing.openStatus")
          : t("reportListing.resolvedStatus")}
      </span>
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError(t("reportListing.describeError"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("reportListing.failedToSubmit"))
        );
      onReported({ id: data.report.id, status: data.report.status });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100"
      >
        {t("reportListing.button")}
      </button>
    );
  }

  return (
    <div className="w-72 rounded-lg border bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs text-gray-500">{t("reportListing.hint")}</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("reportListing.messagePlaceholder")}
        rows={3}
        className="input mb-2 text-sm"
      />
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting ? t("reportListing.submitting") : t("reportListing.submit")}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
        >
          {t("reportListing.cancel")}
        </button>
      </div>
    </div>
  );
}
