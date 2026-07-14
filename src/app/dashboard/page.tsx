"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { formatCents } from "@/lib/format";
import ReviewForm from "@/components/ReviewForm";
import StarRating from "@/components/StarRating";
import type { BuyRequest, Listing, Order, RatingSummary, ReviewSummary } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: loadingSession } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [myRatingSummary, setMyRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
  });
  const [myReviews, setMyReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

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
    ])
      .then(([listingsData, ordersData, buyRequestsData, reviewsData]) => {
        setListings(listingsData.listings ?? []);
        setOrders(ordersData.orders ?? []);
        setBuyRequests(buyRequestsData.buyRequests ?? []);
        setMyRatingSummary(reviewsData.summary ?? { average: null, count: 0 });
        setMyReviews(reviewsData.reviews ?? []);
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
    return <p className="mx-auto max-w-4xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-700">
          You need to{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          My listings
        </h2>
        {listings.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t listed any tickets yet.{" "}
            <Link href="/sell" className="text-indigo-600 underline">
              Sell one now
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
                    {new Date(listing.eventDate).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs">
                    <StatusBadge status={listing.status} />
                    {listing.order && (
                      <span className="ml-2 text-gray-400">
                        Bought by Buyer #{listing.order.buyer.handle}
                      </span>
                    )}
                  </p>
                  {listing.fulfillsRequestId && (
                    <Link
                      href={`/wanted/${listing.fulfillsRequestId}`}
                      className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                    >
                      Matched — fulfills a ticket request
                    </Link>
                  )}
                  {listing.order && (
                    <p className="mt-1 text-xs text-gray-500">
                      Sold for {formatCents(listing.order.totalCents)} · Platform
                      fee {formatCents(listing.order.platformFeeCents)} · You
                      received{" "}
                      <span className="font-medium text-gray-700">
                        {formatCents(listing.order.sellerPayoutCents)}
                      </span>
                    </p>
                  )}
                  {listing.order && (
                    <div className="mt-2">
                      {listing.order.myReview ? (
                        <p className="text-xs text-gray-500">
                          You rated the buyer:{" "}
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
                          label="Rate buyer"
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
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-indigo-600">
                    {formatCents(listing.priceCents)}
                    {listing.quantity > 1 && (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        each
                      </span>
                    )}
                  </p>
                  {listing.status === "ACTIVE" && (
                    <button
                      onClick={() => handleCancel(listing.id)}
                      disabled={cancellingId === listing.id}
                      className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancel
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
          My purchases
        </h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">You haven&apos;t bought any tickets yet.</p>
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
                    {order.listing.venue} · Sold by Seller #
                    {order.listing.seller.handle}
                  </p>
                  <div className="mt-2">
                    {order.myReview ? (
                      <p className="text-xs text-gray-500">
                        You rated the seller:{" "}
                        <StarRating
                          summary={{ average: order.myReview.rating, count: 1 }}
                        />
                      </p>
                    ) : (
                      <ReviewForm
                        orderId={order.id}
                        label="Rate seller"
                        onSubmitted={(review) =>
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id ? { ...o, myReview: review } : o
                            )
                          )
                        }
                      />
                    )}
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
          My ticket requests
        </h2>
        {buyRequests.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t posted any ticket requests yet.{" "}
            <Link href="/wanted/new" className="text-indigo-600 underline">
              Post one now
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
                    {new Date(request.eventDate).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs">
                    <RequestStatusBadge status={request.status} />
                  </p>
                  {request.fulfillingListings &&
                    request.fulfillingListings.length > 0 && (
                      <p className="mt-1 text-xs">
                        <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                          Matched — a seller listed a ticket
                        </span>
                        {request.fulfillingListings.map((l, i) => (
                          <span key={l.id}>
                            {i > 0 && ", "}
                            <Link
                              href={`/listings/${l.id}`}
                              className="text-indigo-600 underline"
                            >
                              View ({formatCents(l.priceCents)})
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-indigo-600">
                    up to {formatCents(request.maxPriceCents)}
                  </p>
                  {request.status === "OPEN" && (
                    <>
                      <button
                        onClick={() => handleFulfillRequest(request.id)}
                        disabled={updatingRequestId === request.id}
                        className="rounded bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        Fulfilled
                      </button>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={updatingRequestId === request.id}
                        className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        Cancel
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
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Reviews about you
          </h2>
          <StarRating summary={myRatingSummary} size="md" />
        </div>
        {myReviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {myReviews.map((review) => (
              <div key={review.id} className="p-4">
                <div className="flex items-center justify-between">
                  <StarRating
                    summary={{ average: review.rating, count: 1 }}
                  />
                  <span className="text-xs text-gray-400">
                    from #{review.reviewer.handle} ·{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
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
  const styles: Record<BuyRequest["status"], string> = {
    OPEN: "bg-green-100 text-green-700",
    FULFILLED: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
  };
  return (
    <span className={`rounded px-2 py-0.5 ${styles[status]}`}>{status}</span>
  );
}

function StatusBadge({ status }: { status: Listing["status"] }) {
  const styles: Record<Listing["status"], string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SOLD: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-100 text-red-600",
  };
  return (
    <span className={`rounded px-2 py-0.5 ${styles[status]}`}>{status}</span>
  );
}
