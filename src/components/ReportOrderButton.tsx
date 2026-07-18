"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import type { MyReport, OrderReportReason } from "@/lib/types";

const REASON_KEYS: Record<OrderReportReason, string> = {
  TICKET_NOT_RECEIVED: "reportForm.reasonTicketNotReceived",
  WRONG_OR_INVALID_TICKET: "reportForm.reasonWrongTicket",
  PAYMENT_ISSUE: "reportForm.reasonPaymentIssue",
  OTHER: "reportForm.reasonOther",
};

export default function ReportOrderButton({
  orderId,
  myReport,
  onReported,
}: {
  orderId: string;
  myReport: MyReport | undefined;
  onReported: (report: { id: string; status: "OPEN" | "RESOLVED" }) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<OrderReportReason>("TICKET_NOT_RECEIVED");
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
          ? t("reportForm.openStatus")
          : t("reportForm.resolvedStatus")}
      </span>
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError(t("reportForm.describeError"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, message }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("reportForm.failedToSubmit"))
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
        className="rounded bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
      >
        {t("dashboard.reportProblem")}
      </button>
    );
  }

  return (
    <div className="w-72 rounded-lg border bg-white p-3 shadow-sm">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as OrderReportReason)}
        className="input mb-2 text-sm"
      >
        {(Object.keys(REASON_KEYS) as OrderReportReason[]).map((value) => (
          <option key={value} value={value}>
            {t(REASON_KEYS[value])}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("reportForm.whatHappenedPlaceholder")}
        rows={3}
        className="input mb-2 text-sm"
      />
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? t("reportForm.submitting") : t("reportForm.submit")}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
        >
          {t("reportForm.cancel")}
        </button>
      </div>
    </div>
  );
}
