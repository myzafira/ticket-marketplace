"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import ImageUploadField from "@/components/ImageUploadField";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function NewBuyRequestPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    eventName: "",
    venue: "",
    eventDate: "",
    quantity: "1",
    maxPrice: "",
    notes: "",
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const contactInfoError = checkListingFieldsForContactInfo({
      "event name": form.eventName,
      venue: form.venue,
      notes: form.notes,
    });
    if (contactInfoError) {
      setError(contactInfoError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/buy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: form.eventName,
          venue: form.venue || undefined,
          eventDate: new Date(form.eventDate).toISOString(),
          quantity: Number(form.quantity),
          maxPrice: Number(form.maxPrice),
          notes: form.notes || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("wantedNew.failedToPost")));
      router.push(`/wanted/${data.buyRequest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <a href="/login" className="text-indigo-600 underline">
            {t("common.logIn")}
          </a>{" "}
          {t("wantedNew.needLoginSuffix")}
        </p>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <a href="/verify" className="text-indigo-600 underline">
            {t("wantedNew.needVerifyLink")}
          </a>{" "}
          {t("wantedNew.needVerifySuffix")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t("wantedNew.title")}</h1>
      <p className="-mt-4 mb-6 text-sm text-gray-500">{t("wantedNew.subtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("wantedNew.eventName")}>
          <input
            required
            value={form.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            placeholder={t("wantedNew.eventNamePlaceholder")}
            className="input"
          />
        </Field>

        <Field label={t("wantedNew.venueOptional")}>
          <input
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder={t("wantedNew.venuePlaceholder")}
            className="input"
          />
        </Field>

        <Field label={t("wantedNew.eventDate")}>
          <input
            required
            type="date"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("wantedNew.quantity")}>
            <input
              required
              type="number"
              min={1}
              max={20}
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("wantedNew.maxPrice")}>
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={form.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              placeholder={t("wantedNew.pricePlaceholder")}
              className="input"
            />
          </Field>
        </div>

        <Field label={t("wantedNew.notesOptional")}>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder={t("wantedNew.notesPlaceholder")}
            className="input"
          />
        </Field>

        <ImageUploadField
          label={t("wantedNew.referenceImage")}
          imageUrl={imageUrl}
          onChange={setImageUrl}
        />
        <p className="-mt-2 text-xs text-gray-400">{t("wantedNew.referenceImageHint")}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("wantedNew.posting") : t("wantedNew.post")}
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
