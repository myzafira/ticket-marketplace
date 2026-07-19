"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("forgotPassword.failed")));
      sessionStorage.setItem(
        "passwordResetContext",
        JSON.stringify({ email, devCode: data.devCode })
      );
      router.push("/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {t("forgotPassword.title")}
      </h1>
      <p className="mb-6 text-sm text-gray-500">{t("forgotPassword.subtitle")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder={t("forgotPassword.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        <Link href="/login" className="text-indigo-600 underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
