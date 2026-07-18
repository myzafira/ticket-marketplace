"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

type Settings = {
  tier1MaxBaht: number;
  tier1Rate: number;
  tier2MaxBaht: number;
  tier2Rate: number;
  tier3Rate: number;
  adminEmails: string;
  lineId: string | null;
  instagramId: string | null;
  phoneNumber: string | null;
};

export default function AdminSettingsPage() {
  const { user, loading: loadingSession } = useSession();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    fetch("/api/admin/settings")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(translateApiError(t, data.error, t("adminSettings.failedToLoad")));
        setSettings({
          ...data.settings,
          adminEmails: data.settings.adminEmails
            .split(",")
            .filter(Boolean)
            .join("\n"),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier1MaxBaht: settings.tier1MaxBaht,
          tier1Rate: settings.tier1Rate,
          tier2MaxBaht: settings.tier2MaxBaht,
          tier2Rate: settings.tier2Rate,
          tier3Rate: settings.tier3Rate,
          adminEmails: settings.adminEmails,
          lineId: settings.lineId,
          instagramId: settings.instagramId,
          phoneNumber: settings.phoneNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("adminSettings.failedToSave")));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSaving(false);
    }
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-700">{t("adminSettings.ownerOnly")}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-red-600">
        {error ?? t("adminSettings.failedToLoad")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("adminSettings.title")}</h1>
        <Link href="/admin" className="text-sm text-indigo-600 underline">
          {t("adminSettings.backToOverview")}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {t("adminSettings.feeTiersTitle")}
          </h2>
          <div className="space-y-4 rounded-lg border bg-white p-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("adminSettings.tier1Threshold")}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={settings.tier1MaxBaht}
                  onChange={(e) =>
                    update("tier1MaxBaht", Number(e.target.value))
                  }
                  className="input"
                />
              </Field>
              <Field label={t("adminSettings.tier1Rate")}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  value={settings.tier1Rate * 100}
                  onChange={(e) =>
                    update("tier1Rate", Number(e.target.value) / 100)
                  }
                  className="input"
                />
              </Field>
            </div>
            <p className="text-xs text-gray-400">
              {t("adminSettings.appliesUpTo", {
                amount: settings.tier1MaxBaht.toLocaleString(),
              })}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("adminSettings.tier2Threshold")}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={settings.tier2MaxBaht}
                  onChange={(e) =>
                    update("tier2MaxBaht", Number(e.target.value))
                  }
                  className="input"
                />
              </Field>
              <Field label={t("adminSettings.tier2Rate")}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  value={settings.tier2Rate * 100}
                  onChange={(e) =>
                    update("tier2Rate", Number(e.target.value) / 100)
                  }
                  className="input"
                />
              </Field>
            </div>
            <p className="text-xs text-gray-400">
              {t("adminSettings.appliesFromTo", {
                from: (settings.tier1MaxBaht + 1).toLocaleString(),
                to: settings.tier2MaxBaht.toLocaleString(),
              })}
            </p>

            <Field label={t("adminSettings.tier3Rate")}>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                required
                value={settings.tier3Rate * 100}
                onChange={(e) =>
                  update("tier3Rate", Number(e.target.value) / 100)
                }
                className="input"
              />
            </Field>
            <p className="text-xs text-gray-400">
              {t("adminSettings.appliesAbove", {
                amount: settings.tier2MaxBaht.toLocaleString(),
              })}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {t("adminSettings.adminAccessTitle")}
          </h2>
          <Field label={t("adminSettings.adminEmailsLabel")}>
            <textarea
              required
              rows={3}
              value={settings.adminEmails}
              onChange={(e) => update("adminEmails", e.target.value)}
              className="input"
            />
          </Field>
          <p className="mt-1 text-xs text-gray-400">
            {t("adminSettings.adminEmailsHint")}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {t("adminSettings.contactTitle")}
          </h2>
          <div className="space-y-4">
            <Field label={t("adminSettings.lineIdLabel")}>
              <input
                value={settings.lineId ?? ""}
                onChange={(e) => update("lineId", e.target.value)}
                placeholder="@ticketright"
                className="input"
              />
            </Field>
            <Field label={t("adminSettings.instagramLabel")}>
              <input
                value={settings.instagramId ?? ""}
                onChange={(e) => update("instagramId", e.target.value)}
                placeholder="@ticketright"
                className="input"
              />
            </Field>
            <Field label={t("adminSettings.phoneLabel")}>
              <input
                value={settings.phoneNumber ?? ""}
                onChange={(e) => update("phoneNumber", e.target.value)}
                placeholder="081-234-5678"
                className="input"
              />
            </Field>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">{t("adminSettings.saved")}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("adminSettings.saveButton")}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}
