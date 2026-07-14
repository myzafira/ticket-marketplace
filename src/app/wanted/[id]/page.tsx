"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import StarRating from "@/components/StarRating";
import type { BuyRequest } from "@/lib/types";

export default function BuyRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSession();
  const [request, setRequest] = useState<BuyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/buy-requests/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load request");
        setRequest(data.buyRequest);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
    return <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!request) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {error ?? "Request not found."}
      </p>
    );
  }

  const eventDate = new Date(request.eventDate);
  const isOwner = user && user.id === request.buyerId;
  const isOpen = request.status === "OPEN";

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
          Wanted
        </span>
        {request.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={request.imageUrl}
            alt="Reference"
            className="mb-4 max-h-80 w-full rounded-lg border object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {request.eventName}
        </h1>
        {request.venue && <p className="mt-1 text-gray-500">{request.venue}</p>}
        <p className="mt-1 text-gray-500">
          {eventDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
          <div>
            <dt className="text-gray-400">Quantity</dt>
            <dd className="text-gray-900">{request.quantity}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Requested by</dt>
            <dd className="text-gray-900">
              Buyer #{request.buyer.handle}
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
              Reviews of this buyer
            </h2>
            <div className="space-y-3">
              {request.buyer.recentReviews.map((review) => (
                <div key={review.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <StarRating summary={{ average: review.rating, count: 1 }} />
                    <span className="text-xs text-gray-400">
                      #{review.reviewer.handle} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
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
            up to {formatCents(request.maxPriceCents)}
          </p>

          {!isOpen ? (
            <p className="font-medium text-gray-400">
              {request.status === "FULFILLED" ? "Fulfilled" : "Cancelled"}
            </p>
          ) : isOwner ? (
            <div className="flex gap-2">
              <button
                onClick={handleMarkFulfilled}
                disabled={updating}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark fulfilled
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : !user ? (
            <a
              href="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              Log in to respond
            </a>
          ) : !user.emailVerified ? (
            <a
              href="/verify"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              Verify account to respond
            </a>
          ) : (
            <a
              href={`/sell?${sellPrefillParams.toString()}`}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              I have this ticket
            </a>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
