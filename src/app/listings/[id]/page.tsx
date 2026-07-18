"use client";

import { useEffect, useState, use } from "react";
import { formatCents } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import StarRating from "@/components/StarRating";
import MessageThread from "@/components/MessageThread";
import FavoriteButton from "@/components/FavoriteButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import ReportListingButton from "@/components/ReportListingButton";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import type { Listing, Message } from "@/lib/types";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSession();
  const { t, locale } = useTranslation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            translateApiError(t, data.error, t("listingDetail.failedToLoad"))
          );
        setListing(data.listing);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!user || !listing || user.id === listing.sellerId) return;
    fetch(`/api/listings/${id}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {});
  }, [id, user, listing]);

  async function handleSendMessage(body: string) {
    const res = await fetch(`/api/listings/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        translateApiError(t, data.error, t("listingDetail.failedToSend"))
      );
    setMessages((prev) => [...prev, data.message]);
  }

  async function handleBuy() {
    setBuying(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${id}/buy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("listingDetail.failedToBuy"))
        );
      setBought(true);
      setListing((prev) => (prev ? { ...prev, status: "SOLD" } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!listing) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {error ?? t("listingDetail.notFound")}
      </p>
    );
  }

  const eventDate = new Date(listing.eventDate);
  const isOwner = user && user.id === listing.sellerId;
  const isSold = listing.status !== "ACTIVE";
  const needsVerification = user && !user.emailVerified;
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {listing.fulfillsRequestId && (
          <a
            href={`/wanted/${listing.fulfillsRequestId}`}
            className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
          >
            {t("listingDetail.fulfillsRequest")}
          </a>
        )}
        {listing.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={t("listingDetail.ticketAlt")}
            className="mb-4 max-h-80 w-full rounded-lg border object-contain"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {listing.eventName}
          </h1>
          <FavoriteButton
            listingId={listing.id}
            isFavorited={Boolean(listing.isFavorited)}
            size="md"
            onChange={(next) =>
              setListing((prev) => (prev ? { ...prev, isFavorited: next } : prev))
            }
          />
        </div>
        <p className="mt-1 text-gray-500">{listing.venue}</p>
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
            <dt className="text-gray-400">{t("listingDetail.listingLabel")}</dt>
            <dd className="text-gray-900">{listing.title}</dd>
          </div>
          {listing.section && (
            <div>
              <dt className="text-gray-400">{t("listingDetail.sectionLabel")}</dt>
              <dd className="text-gray-900">{listing.section}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400">{t("listingDetail.quantityLabel")}</dt>
            <dd className="text-gray-900">{listing.quantity}</dd>
          </div>
          {listing.faceValueCents !== null && (
            <div>
              <dt className="text-gray-400">{t("listingDetail.faceValueLabel")}</dt>
              <dd className="text-gray-900">
                {formatCents(listing.faceValueCents)}
                <span className="ml-1 text-xs text-gray-400">
                  (
                  {listing.priceCents > listing.faceValueCents
                    ? t("listingDetail.markupAbove", {
                        percent: Math.round(
                          (listing.priceCents / listing.faceValueCents - 1) * 100
                        ),
                      })
                    : t("listingDetail.markupAtOrBelow")}
                  )
                </span>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400">{t("listingDetail.sellerIdLabel")}</dt>
            <dd className="text-gray-900">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>#{listing.seller.handle}</span>
                {listing.seller.rating && (
                  <StarRating summary={listing.seller.rating} />
                )}
                {listing.seller.isVerified && <VerifiedBadge />}
              </div>
              {Boolean(listing.seller.salesCount) && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {t(
                    listing.seller.salesCount === 1
                      ? "trust.soldCount"
                      : "trust.soldCountPlural",
                    { count: listing.seller.salesCount! }
                  )}
                </p>
              )}
            </dd>
          </div>
        </dl>

        {listing.description && (
          <p className="mt-6 border-t pt-6 text-gray-700">
            {listing.description}
          </p>
        )}

        {listing.seller.recentReviews && listing.seller.recentReviews.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              {t("listingDetail.reviewsOfSeller")}
            </h2>
            <div className="space-y-3">
              {listing.seller.recentReviews.map((review) => (
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
            {formatCents(listing.priceCents)}
          </p>

          {bought ? (
            <p className="font-medium text-green-600">
              {t("listingDetail.purchaseComplete")}
            </p>
          ) : isSold ? (
            <p className="font-medium text-gray-400">
              {t("listingDetail.noLongerAvailable")}
            </p>
          ) : isOwner ? (
            <p className="text-sm text-gray-400">{t("listingDetail.yourListing")}</p>
          ) : !user ? (
            <a
              href="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              {t("listingDetail.loginToBuy")}
            </a>
          ) : needsVerification ? (
            <a
              href="/verify"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              {t("listingDetail.verifyToBuy")}
            </a>
          ) : (
            <button
              onClick={handleBuy}
              disabled={buying}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {buying ? t("listingDetail.processing") : t("listingDetail.buyTicket")}
            </button>
          )}
        </div>

        {user && !isOwner && !isSold && (
          <div className="mt-3 flex justify-end">
            <ReportListingButton
              listingId={listing.id}
              myReport={listing.myReport}
              onReported={(report) =>
                setListing((prev) => (prev ? { ...prev, myReport: report } : prev))
              }
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {user && !isOwner && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              {t("listingDetail.askSeller")}
            </h2>
            {needsVerification ? (
              <p className="text-sm text-gray-500">
                <a href="/verify" className="text-indigo-600 underline">
                  {t("listingDetail.verifyToMessagePrefix")}
                </a>{" "}
                {t("listingDetail.verifyToMessageSuffix")}
              </p>
            ) : (
              <MessageThread
                messages={messages}
                onSend={handleSendMessage}
                placeholder={t("listingDetail.messagePlaceholder")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
