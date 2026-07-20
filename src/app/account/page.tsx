"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function AccountPage() {
  const { user, loading, refresh } = useSession();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState<string | null>(null);
  const [savingNickname, setSavingNickname] = useState(false);

  const [vipPerks, setVipPerks] = useState<{
    feeDiscountPercent: number;
    earlyAccessMinutes: number;
  } | null>(null);

  useEffect(() => {
    if (user?.role !== "VIP_USER") return;
    fetch("/api/settings/fees")
      .then((res) => res.json())
      .then((data) =>
        setVipPerks({
          feeDiscountPercent: data.vipFeeDiscountPercent,
          earlyAccessMinutes: data.vipEarlyAccessMinutes,
        })
      )
      .catch(() => {});
  }, [user?.role]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t("account.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("account.failedChangePassword"))
        );
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault();
    setNicknameError(null);
    setNicknameSuccess(null);
    setSavingNickname(true);
    try {
      const res = await fetch("/api/account/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("account.failedSaveNickname"))
        );
      setNicknameSuccess(t("account.saved", { handle: data.handle }));
      await refresh();
    } catch (err) {
      setNicknameError(
        err instanceof Error ? err.message : t("common.somethingWentWrong")
      );
    } finally {
      setSavingNickname(false);
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
          {t("common.needLoginSuffixGeneric")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("account.title")}</h1>
        {user.role === "VIP_USER" && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {t("account.vipBadge")}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm text-gray-500">
        {t("account.signedInAs", { name: user.name, email: user.email })}
      </p>
      {user.role === "VIP_USER" && vipPerks && (
        <ul className="mb-6 list-disc space-y-0.5 pl-5 text-xs text-amber-700">
          <li>
            {t("account.vipPerkFeeDiscount", { percent: vipPerks.feeDiscountPercent })}
          </li>
          <li>
            {t("account.vipPerkEarlyAccess", { minutes: vipPerks.earlyAccessMinutes })}
          </li>
          <li>{t("account.vipPerkPriorityMatching")}</li>
        </ul>
      )}
      {user.role !== "VIP_USER" && <div className="mb-6" />}

      <h2 className="mb-1 font-semibold text-gray-900">{t("account.nicknameTitle")}</h2>
      <p className="mb-3 text-sm text-gray-500">
        {t("account.nicknameHintPrefix")}{" "}
        <span className="font-medium">{t("account.nicknameExample")}</span>.{" "}
        {t("account.nicknameHintSuffix")}
      </p>
      <form onSubmit={handleSaveNickname} className="mb-8 flex gap-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("account.nicknamePlaceholder")}
          maxLength={20}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={savingNickname}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {savingNickname ? t("common.saving") : t("common.save")}
        </button>
      </form>
      {nicknameError && (
        <p className="-mt-6 mb-6 text-sm text-red-600">{nicknameError}</p>
      )}
      {nicknameSuccess && (
        <p className="-mt-6 mb-6 text-sm text-green-600">{nicknameSuccess}</p>
      )}

      <h2 className="mb-3 font-semibold text-gray-900">
        {t("account.changePasswordTitle")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder={t("account.currentPasswordPlaceholder")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("account.newPasswordPlaceholder")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("account.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">{t("account.passwordChanged")}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("account.updating") : t("account.updateButton")}
        </button>
      </form>
    </div>
  );
}
