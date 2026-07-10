"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/listings${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setListings(data.listings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Buy and sell tickets
        </h1>
        <p className="mt-1 text-gray-500">
          Browse tickets listed by other fans, or list your own.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by event, venue, or title..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6 w-full rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />

      {loading && <p className="text-gray-500">Loading listings…</p>}

      {!loading && listings.length === 0 && (
        <p className="text-gray-500">No tickets found.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
