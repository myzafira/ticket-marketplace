"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { formatCents } from "@/lib/format";
import ReviewForm from "@/components/ReviewForm";
import StarRating from "@/components/StarRating";
import TicketProofUploader from "@/components/TicketProofUploader";
import ReportOrderButton from "@/components/ReportOrderButton";
import ListingCard from "@/components/ListingCard";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { BuyRequest, Listing, Order, RatingSummary, ReviewSummary } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: loadingSession } = useSession();
  const { t, locale } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [myRatingSummary, setMyRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
  });
  const [myReviews, setMyReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/me/listings").then((r) => r.json()),
      fetch("/api/me/orders").then((r) => r.json()),
      fetch("/api/me/buy-requests").then((r) => r.json()),
      fetch("/api/me/reviews").then((r) => r.json()),
      fetch("/api/me/favorites").then((r) => r.json()),
    ])
      .then(([listingsData, ordersData, buyRequestsData, reviewsData, favoritesData]) => {
        setListings(listingsData.listings ?? []);
        setOrders(ordersData.orders ?? []);
        setBuyRequests(buyRequestsData.buyRequests ?? []);
        setMyRatingSummary(reviewsData.summary ?? { average: null, count: 0 });
        setMyReviews(reviewsData.reviews ?? []);
        setFavorites(favoritesData.listings ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "CANCELLED" } : l))
        );
      }
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCancelRequest(id: string) {
    setUpdatingRequestId(id);
    try {
      const res = await fetch(`/api/buy-requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBuyRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
        );
      }
    } finally {
      setUpdatingRequestId(null);
    }
  }

  async function handleFulfillRequest(id: string) {
    setUpdatingRequestId(id);
    try {
      const res = await fetch(`/api/buy-requests/${id}/fulfill`, {
        method: "POST",
      });
      if (res.ok) {
        setBuyRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "FULFILLED" } : r))
        );
      }
    } finally {
      setUpdatingRequestId(null);
    }
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-4xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <Link href="/login" className="text-indigo-600 underline">
            {t("common.logIn")}
          </Link>{" "}
          {t("dashboard.needLoginSuffix")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("dashboard.myListings")}
        </h2>
        {listings.length === 0 ? (
          <p className="text-gray-500">
            {t("dashboard.noListings")}{" "}
            <Link href="/sell" className="text-indigo-600 underline">
              {t("dashboard.sellNow")}
            </Link>
            .
          </p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {listing.eventName}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {listing.venue} ·{" "}
                    {new Date(listing.eventDate).toLocaleDateString(dateLocale)}
                  </p>
                  <p className="mt-1 text-xs">
                    <StatusBadge status={listing.status} />
                    {listing.order && (
                      <span className="ml-2 text-gray-400">
                        {t("dashboard.boughtBy", { handle: listing.order.buyer.handle })}
                      </span>
                    )}
                  </p>
                  {listing.fulfillsRequestId && (
                    <Link
                      href={`/wanted/${listing.fulfillsRequestId}`}
                      className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                    >
                      {t("dashboard.matchedFulfills")}
                    </Link>
                  )}
                  {listing.order && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t("dashboard.soldForLine", {
                        total: formatCents(listing.order.totalCents),
                        fee: formatCents(listing.order.platformFeeCents),
                      })}{" "}
                      <span className="font-medium text-gray-700">
                        {formatCents(listing.order.sellerPayoutCents)}
                      </span>
                    </p>
                  )}
                  {listing.order && (
                    <TicketProofUploader
                      orderId={listing.order.id}
                      imageUrl={listing.order.ticketProofUrl}
                      onUploaded={(url) =>
                        setListings((prev) =>
                          prev.map((l) =>
                            l.id === listing.id && l.order
                              ? { ...l, order: { ...l.order, ticketProofUrl: url } }
                              : l
                          )
                        )
                      }
                    />
                  )}
                  {listing.order && (
                    <div className="mt-2 flex flex-wrap items-start gap-2">
                      {listing.order.myReview ? (
                        <p className="text-xs text-gray-500">
                          {t("dashboard.youRatedBuyer")}{" "}
                          <StarRating
                            summary={{
                              average: listing.order.myReview.rating,
                              count: 1,
                            }}
                          />
                        </p>
                      ) : (
                        <ReviewForm
                          orderId={listing.order.id}
                          label={t("dashboard.rateBuyer")}
                          onSubmitted={(review) =>
                            setListings((prev) =>
                              prev.map((l) =>
                                l.id === listing.id && l.order
                                  ? { ...l, order: { ...l.order, myReview: review } }
                                  : l
                              )
                            )
                          }
                        />
                      )}
                      <ReportOrderButton
                        orderId={listing.order.id}
                        myReport={listing.order.myReport}
                        onReported={(report) =>
                          setListings((prev) =>
                            prev.map((l) =>
                              l.id === listing.id && l.order
                                ? { ...l, order: { ...l.order, myReport: report } }
                                : l
                            )
                          )
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-indigo-600">
                    {formatCents(listing.priceCents)}
                    {listing.quantity > 1 && (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        {t("dashboard.each")}
                      </span>
                    )}
                  </p>
                  {listing.status === "ACTIVE" && (
                    <button
                      onClick={() => handleCancel(listing.id)}
                      disabled={cancellingId === listing.id}
                      className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      {t("dashboard.cancelListing")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("dashboard.myPurchases")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">{t("dashboard.noPurchases")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <Link
                    href={`/listings/${order.listing.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {order.listing.eventName}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {order.listing.venue} ·{" "}
                    {t("dashboard.soldBy", { handle: order.listing.seller.handle })}
                  </p>
                  <p className="mt-1 text-xs">
                    {order.ticketProofUrl ? (
                      <a
                        href={order.ticketProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                      >
                        {t("dashboard.viewTicket")}
                      </a>
                    ) : (
                      <span className="text-gray-400">
                        {t("dashboard.waitingForTicket")}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-start gap-2">
                    {order.myReview ? (
                      <p className="text-xs text-gray-500">
                        {t("dashboard.youRatedSeller")}{" "}
                        <StarRating
                          summary={{ average: order.myReview.rating, count: 1 }}
                        />
                      </p>
                    ) : (
                      <ReviewForm
                        orderId={order.id}
                        label={t("dashboard.rateSeller")}
                        onSubmitted={(review) =>
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id ? { ...o, myReview: review } : o
                            )
                          )
                        }
                      />
                    )}
                    <ReportOrderButton
                      orderId={order.id}
                      myReport={order.myReport}
                      onReported={(report) =>
                        setOrders((prev) =>
                          prev.map((o) =>
                            o.id === order.id ? { ...o, myReport: report } : o
                          )
                        )
                      }
                    />
                  </div>
                </div>
                <p className="font-semibold text-indigo-600">
                  {formatCents(order.totalCents)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("dashboard.myTicketRequests")}
        </h2>
        {buyRequests.length === 0 ? (
          <p className="text-gray-500">
            {t("dashboard.noRequests")}{" "}
            <Link href="/wanted/new" className="text-indigo-600 underline">
              {t("dashboard.postOneNow")}
            </Link>
            .
          </p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {buyRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <Link
                    href={`/wanted/${request.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {request.eventName}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {request.venue ? `${request.venue} · ` : ""}
                    {new Date(request.eventDate).toLocaleDateString(dateLocale)}
                  </p>
                  <p className="mt-1 text-xs">
                    <RequestStatusBadge status={request.status} />
                  </p>
                  {request.fulfillingListings &&
                    request.fulfillingListings.length > 0 && (
                      <p className="mt-1 text-xs">
                        <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                          {t("dashboard.matchedSellerListed")}
                        </span>
                        {request.fulfillingListings.map((l, i) => (
                          <span key={l.id}>
                            {i > 0 && ", "}
                            <Link
                              href={`/listings/${l.id}`}
                              className="text-indigo-600 underline"
                            >
                              {t("dashboard.viewOffer", {
                                price: formatCents(l.priceCents),
                              })}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-indigo-600">
                    {t("dashboard.upTo", { price: formatCents(request.maxPriceCents) })}
                  </p>
                  {request.status === "OPEN" && (
                    <>
                      <button
                        onClick={() => handleFulfillRequest(request.id)}
                        disabled={updatingRequestId === request.id}
                        className="rounded bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        {t("dashboard.markFulfilled")}
                      </button>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={updatingRequestId === request.id}
                        className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {t("dashboard.cancelRequest")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("dashboard.myFavorites")}
        </h2>
        {favorites.length === 0 ? (
          <p className="text-gray-500">
            {t("dashboard.noFavorites")}{" "}
            <Link href="/" className="text-indigo-600 underline">
              {t("dashboard.browseListings")}
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.reviewsAboutYou")}
          </h2>
          <StarRating summary={myRatingSummary} size="md" />
        </div>
        {myReviews.length === 0 ? (
          <p className="text-gray-500">{t("dashboard.noReviewsYet")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {myReviews.map((review) => (
              <div key={review.id} className="p-4">
                <div className="flex items-center justify-between">
                  <StarRating
                    summary={{ average: review.rating, count: 1 }}
                  />
                  <span className="text-xs text-gray-400">
                    #{review.reviewer.handle} ·{" "}
                    {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-gray-700">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: BuyRequest["status"] }) {
  const { t } = useTranslation();
  const styles: Record<BuyRequest["status"], string> = {
    OPEN: "bg-green-100 text-green-700",
    FULFILLED: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
  };
  const labels: Record<BuyRequest["status"], string> = {
    OPEN: t("dashboard.requestOpen"),
    FULFILLED: t("dashboard.requestFulfilled"),
    CANCELLED: t("dashboard.requestCancelled"),
  };
  return (
    <span className={`rounded px-2 py-0.5 ${styles[status]}`}>{labels[status]}</span>
  );
}

function StatusBadge({ status }: { status: Listing["status"] }) {
  const { t } = useTranslation();
  const styles: Record<Listing["status"], string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SOLD: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
  };
  const labels: Record<Listing["status"], string> = {
    ACTIVE: t("dashboard.statusActive"),
    SOLD: t("dashboard.statusSold"),
    CANCELLED: t("dashboard.statusCancelled"),
  };
  return (
    <span className={`rounded px-2 py-0.5 ${styles[status]}`}>{labels[status]}</span>
  );
}
