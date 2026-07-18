"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function VerifyPage() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [emailCode, setEmailCode] = useState("");
  const [devEmailCode, setDevEmailCode] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("devVerificationCodes");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDevEmailCode(parsed.email ?? null);
      } catch {
        // ignore malformed session data
      }
      sessionStorage.removeItem("devVerificationCodes");
    }
  }, []);

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-code", { method: "POST" });
      const data = await res.json();
      if (res.ok) setDevEmailCode(data.devCode);
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyEmail(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("verify.failed")));
      await refresh();
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : t("common.somethingWentWrong")
      );
    } finally {
      setSubmittingEmail(false);
    }
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-sm px-4 py-12 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <Link href="/login" className="text-indigo-600 underline">
            {t("common.logIn")}
          </Link>{" "}
          {t("verify.needLoginSuffix")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {t("verify.title")}
      </h1>
      <p className="mb-6 text-sm text-gray-500">{t("verify.subtitle")}</p>

      {user.emailVerified ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-700">{t("verify.verifiedText")}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("verify.goToMarketplace")}
          </button>
        </div>
      ) : (
        <section>
          <p className="mb-2 text-xs text-gray-400">
            {t("verify.sentTo", { email: user.email })}{" "}
            {devEmailCode ? (
              <span className="text-gray-600">
                {t("verify.demoModePrefix")}{" "}
                <span className="font-mono font-semibold">{devEmailCode}</span>.
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 underline"
              >
                {resending ? t("verify.resending") : t("verify.resend")}
              </button>
            )}
          </p>
          <form onSubmit={handleVerifyEmail} className="flex gap-2">
            <input
              required
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder={t("verify.codePlaceholder")}
              className="input"
            />
            <button
              type="submit"
              disabled={submittingEmail}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t("verify.verifyButton")}
            </button>
          </form>
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </section>
      )}
    </div>
  );
}
