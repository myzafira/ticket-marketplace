"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { checkAddressLooksReal } from "@/lib/addressValidation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const addressError = checkAddressLooksReal(address);
    if (addressError) {
      setError(translateApiError(t, addressError));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phoneNumber, address }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("signup.failed")));
      sessionStorage.setItem(
        "devVerificationCodes",
        JSON.stringify({ email: data.devEmailCode })
      );
      await refresh();
      router.push("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {t("signup.title")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          placeholder={t("signup.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <input
          type="email"
          required
          placeholder={t("signup.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="tel"
          required
          placeholder={t("signup.phonePlaceholder")}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input"
        />
        <input
          type="text"
          required
          placeholder={t("signup.addressPlaceholder")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("signup.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("signup.submitting") : t("signup.submit")}
        </button>
      </form>
      <p className="mt-3 text-xs text-gray-400">
        {t("signup.agreementPrefix")}{" "}
        <Link href="/terms" className="underline hover:text-gray-600">
          {t("footer.terms")}
        </Link>{" "}
        {t("signup.agreementAnd")}{" "}
        <Link href="/privacy" className="underline hover:text-gray-600">
          {t("footer.privacy")}
        </Link>
        .
      </p>
      <p className="mt-4 text-sm text-gray-500">
        {t("signup.haveAccount")}{" "}
        <Link href="/login" className="text-indigo-600 underline">
          {t("signup.login")}
        </Link>
      </p>
    </div>
  );
}
