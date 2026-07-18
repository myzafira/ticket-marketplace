"use client";

import { useEffect, useState, use } from "react";
import { formatCents } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import StarRating from "@/components/StarRating";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import type { BuyRequest } from "@/lib/types";

export default function BuyRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSession();
  const { t, locale } = useTranslation();
  const [request, setRequest] = useState<BuyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/buy-requests/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            translateApiError(t, data.error, t("wantedDetail.failedToLoad"))
          );
        setRequest(data.buyRequest);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/buy-requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRequest((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkFulfilled() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/buy-requests/${id}/fulfill`, {
        method: "POST",
      });
      if (res.ok) {
        setRequest((prev) => (prev ? { ...prev, status: "FULFILLED" } : prev));
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!request) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {error ?? t("wantedDetail.notFound")}
      </p>
    );
  }

  const eventDate = new Date(request.eventDate);
  const isOwner = user && user.id === request.buyerId;
  const isOpen = request.status === "OPEN";
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  const sellPrefillParams = new URLSearchParams({
    eventName: request.eventName,
    ...(request.venue ? { venue: request.venue } : {}),
    eventDate: request.eventDate.slice(0, 10),
    quantity: String(request.quantity),
    requestId: request.id,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <span className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {t("wantedDetail.badge")}
        </span>
        {request.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={request.imageUrl}
            alt={t("wantedDetail.referenceAlt")}
            className="mb-4 max-h-80 w-full rounded-lg border object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {request.eventName}
        </h1>
        {request.venue && <p className="mt-1 text-gray-500">{request.venue}</p>}
        <p className="mt-1 text-gray-500">
          {eventDate.toLocaleDateString(dateLocale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
          <div>
            <dt className="text-gray-400">{t("wantedDetail.quantityLabel")}</dt>
            <dd className="text-gray-900">{request.quantity}</dd>
          </div>
          <div>
            <dt className="text-gray-400">{t("wantedDetail.requestedByLabel")}</dt>
            <dd className="text-gray-900">
              {t("wantedDetail.buyerHandle", { handle: request.buyer.handle })}
              {request.buyer.rating && (
                <span className="ml-2">
                  <StarRating summary={request.buyer.rating} />
                </span>
              )}
            </dd>
          </div>
        </dl>

        {request.notes && (
          <p className="mt-6 border-t pt-6 text-gray-700">{request.notes}</p>
        )}

        {request.buyer.recentReviews && request.buyer.recentReviews.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              {t("wantedDetail.reviewsOfBuyer")}
            </h2>
            <div className="space-y-3">
              {request.buyer.recentReviews.map((review) => (
                <div key={review.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <StarRating summary={{ average: review.rating, count: 1 }} />
                    <span className="text-xs text-gray-400">
                      #{review.reviewer.handle} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-0.5 text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t pt-6">
          <p className="text-2xl font-bold text-indigo-600">
            {t("wantedDetail.upTo", { price: formatCents(request.maxPriceCents) })}
          </p>

          {!isOpen ? (
            <p className="font-medium text-gray-400">
              {request.status === "FULFILLED"
                ? t("wantedDetail.fulfilled")
                : t("wantedDetail.cancelled")}
            </p>
          ) : isOwner ? (
            <div className="flex gap-2">
              <button
                onClick={handleMarkFulfilled}
                disabled={updating}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {t("wantedDetail.markFulfilled")}
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {t("wantedDetail.cancel")}
              </button>
            </div>
          ) : !user ? (
            <a
              href="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              {t("wantedDetail.loginToRespond")}
            </a>
          ) : !user.emailVerified ? (
            <a
              href="/verify"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              {t("wantedDetail.verifyToRespond")}
            </a>
          ) : (
            <a
              href={`/sell?${sellPrefillParams.toString()}`}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              {t("wantedDetail.haveThisTicket")}
            </a>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
