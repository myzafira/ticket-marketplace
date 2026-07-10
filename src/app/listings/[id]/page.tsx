"use client";

import { useEffect, useState, use } from "react";
import { formatCents } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import type { Listing } from "@/lib/types";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load listing");
        setListing(data.listing);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBuy() {
    setBuying(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${id}/buy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to buy ticket");
      setBought(true);
      setListing((prev) => (prev ? { ...prev, status: "SOLD" } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!listing) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {error ?? "Listing not found."}
      </p>
    );
  }

  const eventDate = new Date(listing.eventDate);
  const isOwner = user && user.id === listing.sellerId;
  const isSold = listing.status !== "ACTIVE";
  const needsVerification =
    user && (!user.emailVerified || !user.phoneVerified);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {listing.fulfillsRequestId && (
          <a
            href={`/wanted/${listing.fulfillsRequestId}`}
            className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
          >
            Fulfills a ticket request
          </a>
        )}
        {listing.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt="Ticket"
            className="mb-4 max-h-80 w-full rounded-lg border object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {listing.eventName}
        </h1>
        <p className="mt-1 text-gray-500">{listing.venue}</p>
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
            <dt className="text-gray-400">Listing</dt>
            <dd className="text-gray-900">{listing.title}</dd>
          </div>
          {listing.section && (
            <div>
              <dt className="text-gray-400">Section</dt>
              <dd className="text-gray-900">{listing.section}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400">Quantity</dt>
            <dd className="text-gray-900">{listing.quantity}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Seller ID</dt>
            <dd className="text-gray-900">#{listing.seller.handle}</dd>
          </div>
        </dl>

        {listing.description && (
          <p className="mt-6 border-t pt-6 text-gray-700">
            {listing.description}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t pt-6">
          <p className="text-2xl font-bold text-indigo-600">
            {formatCents(listing.priceCents)}
          </p>

          {bought ? (
            <p className="font-medium text-green-600">
              Purchase complete — check your dashboard.
            </p>
          ) : isSold ? (
            <p className="font-medium text-gray-400">No longer available</p>
          ) : isOwner ? (
            <p className="text-sm text-gray-400">This is your listing</p>
          ) : !user ? (
            <a
              href="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              Log in to buy
            </a>
          ) : needsVerification ? (
            <a
              href="/verify"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              Verify account to buy
            </a>
          ) : (
            <button
              onClick={handleBuy}
              disabled={buying}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {buying ? "Processing…" : "Buy ticket"}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
