"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import ImageUploadField from "@/components/ImageUploadField";
import { formatCents, bahtToCents } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

type FeeTierInfo = { label: string; ratePercent: number };

type MarketPriceStats = {
  count: number;
  averageCents?: number;
  minCents?: number;
  maxCents?: number;
};

export default function SellPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-xl px-4 py-8 text-gray-500">
          {t("common.loading")}
        </p>
      }
    >
      <SellForm />
    </Suspense>
  );
}

function SellForm() {
  const { user, loading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feeTiers, setFeeTiers] = useState<FeeTierInfo[]>([]);
  const [maxMarkupPercent, setMaxMarkupPercent] = useState<number | null>(null);
  const [trustDiscount, setTrustDiscount] = useState<{
    minSales: number;
    percent: number;
  } | null>(null);
  const [marketStats, setMarketStats] = useState<MarketPriceStats | null>(null);
  const requestId = searchParams.get("requestId") ?? undefined;

  useEffect(() => {
    fetch("/api/settings/fees")
      .then((res) => res.json())
      .then((data) => {
        setFeeTiers(data.tiers ?? []);
        setMaxMarkupPercent(data.maxResaleMarkupPercent ?? null);
        if (data.trustedSellerFeeDiscountPercent > 0) {
          setTrustDiscount({
            minSales: data.trustedSellerMinSales,
            percent: data.trustedSellerFeeDiscountPercent,
          });
        }
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    title: "",
    eventName: searchParams.get("eventName") ?? "",
    venue: searchParams.get("venue") ?? "",
    eventDate: searchParams.get("eventDate") ?? "",
    section: "",
    quantity: searchParams.get("quantity") ?? "1",
    faceValue: "",
    price: "",
    description: "",
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Debounced lookup of what this event's other listings are going for, so
  // sellers can price fairly without leaving the form.
  useEffect(() => {
    const eventName = form.eventName.trim();
    if (!eventName) {
      setMarketStats(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/listings/price-check?eventName=${encodeURIComponent(eventName)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setMarketStats(data.count > 0 ? data : null))
        .catch(() => {});
    }, 500);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.eventName]);

  const faceValueCents = form.faceValue ? bahtToCents(Number(form.faceValue)) : null;
  const maxAllowedCents =
    faceValueCents && maxMarkupPercent
      ? Math.round((faceValueCents * maxMarkupPercent) / 100)
      : null;
  const priceCents = form.price ? bahtToCents(Number(form.price)) : null;
  const priceExceedsCap = Boolean(
    maxAllowedCents && priceCents && priceCents > maxAllowedCents
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const contactInfoError = checkListingFieldsForContactInfo({
      "listing title": form.title,
      "event name": form.eventName,
      venue: form.venue,
      section: form.section,
      description: form.description,
    });
    if (contactInfoError) {
      setError(contactInfoError);
      return;
    }

    if (priceExceedsCap && maxAllowedCents && maxMarkupPercent) {
      setError(
        t("sell.priceExceedsCap", {
          percent: maxMarkupPercent,
          max: formatCents(maxAllowedCents),
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          eventName: form.eventName,
          venue: form.venue,
          eventDate: new Date(form.eventDate).toISOString(),
          section: form.section || undefined,
          quantity: Number(form.quantity),
          price: Number(form.price),
          faceValue: Number(form.faceValue),
          description: form.description || undefined,
          fulfillsRequestId: requestId,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errorKey === "errors.priceExceedsMarkupCap") {
          throw new Error(
            t("errors.priceExceedsMarkupCap", {
              percent: data.markupPercent,
              max: formatCents(data.maxAllowedCents),
            })
          );
        }
        throw new Error(translateApiError(t, data.error, t("sell.failedToCreate")));
      }
      router.push(`/listings/${data.listing.id}`);
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
          {t("sell.needLoginSuffix")}
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
            {t("sell.needVerifyLink")}
          </a>{" "}
          {t("sell.needVerifySuffix")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t("sell.title")}</h1>
      {requestId && (
        <p className="mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("sell.respondingToPrefix")}{" "}
          <a href={`/wanted/${requestId}`} className="underline">
            {t("sell.respondingToLink")}
          </a>
          {t("sell.respondingToSuffix")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <Field label={t("sell.listingTitle")}>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder={t("sell.listingTitlePlaceholder")}
            className="input"
          />
        </Field>

        <Field label={t("sell.eventName")}>
          <input
            required
            value={form.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            placeholder={t("sell.eventNamePlaceholder")}
            className="input"
          />
          {marketStats && marketStats.count > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {t("sell.marketPriceHint", {
                average: formatCents(marketStats.averageCents!),
                min: formatCents(marketStats.minCents!),
                max: formatCents(marketStats.maxCents!),
                count: marketStats.count,
              })}
            </p>
          )}
        </Field>

        <Field label={t("sell.venue")}>
          <input
            required
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder={t("sell.venuePlaceholder")}
            className="input"
          />
        </Field>

        <Field label={t("sell.eventDate")}>
          <input
            required
            type="date"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("sell.sectionOptional")}>
            <input
              value={form.section}
              onChange={(e) => update("section", e.target.value)}
              placeholder={t("sell.sectionPlaceholder")}
              className="input"
            />
          </Field>
          <Field label={t("sell.quantity")}>
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
        </div>

        <Field label={t("sell.faceValue")}>
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={form.faceValue}
            onChange={(e) => update("faceValue", e.target.value)}
            placeholder={t("sell.pricePlaceholder")}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-400">{t("sell.faceValueHint")}</p>
        </Field>

        <Field label={t("sell.pricePerTicket")}>
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder={t("sell.pricePlaceholder")}
            className={`input ${priceExceedsCap ? "border-red-400" : ""}`}
          />
          {maxAllowedCents !== null && maxMarkupPercent !== null && (
            <p
              className={`mt-1 text-xs ${
                priceExceedsCap ? "font-medium text-red-600" : "text-gray-400"
              }`}
            >
              {t("sell.maxAllowedHint", {
                max: formatCents(maxAllowedCents),
                percent: maxMarkupPercent,
              })}
            </p>
          )}
          {feeTiers.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {t("sell.platformFeeHint", {
                tiers: feeTiers
                  .map((tier) => `${tier.ratePercent}% (${tier.label})`)
                  .join(", "),
              })}
            </p>
          )}
          {trustDiscount && (
            <p className="mt-1 text-xs text-indigo-500">
              {t("sell.trustDiscountHint", {
                sales: trustDiscount.minSales,
                percent: trustDiscount.percent,
              })}
            </p>
          )}
        </Field>

        <Field label={t("sell.descriptionOptional")}>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="input"
          />
        </Field>

        <ImageUploadField
          label={t("sell.ticketPhotoOptional")}
          imageUrl={imageUrl}
          onChange={setImageUrl}
        />
        <p className="-mt-2 text-xs text-gray-400">{t("sell.ticketPhotoHint")}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t("sell.publishing") : t("sell.publish")}
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
