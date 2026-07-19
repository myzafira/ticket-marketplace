"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("passwordResetContext");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.devCode) setDevCode(parsed.devCode);
      } catch {
        // ignore malformed session data
      }
      sessionStorage.removeItem("passwordResetContext");
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("resetPassword.failed")));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-700">{t("resetPassword.successText")}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("resetPassword.goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {t("resetPassword.title")}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {t("resetPassword.subtitle")}
        {devCode && (
          <>
            {" "}
            {t("verify.demoModePrefix")}{" "}
            <span className="font-mono font-semibold">{devCode}</span>.
          </>
        )}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder={t("resetPassword.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          required
          placeholder={t("resetPassword.codePlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("resetPassword.newPasswordPlaceholder")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("resetPassword.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        <Link href="/forgot-password" className="text-indigo-600 underline">
          {t("resetPassword.requestNewCode")}
        </Link>
        {" · "}
        <Link href="/login" className="text-indigo-600 underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
