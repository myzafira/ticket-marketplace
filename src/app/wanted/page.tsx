"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BuyRequestCard from "@/components/BuyRequestCard";
import type { BuyRequest } from "@/lib/types";

export default function WantedPage() {
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/buy-requests${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setBuyRequests(data.buyRequests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ticket requests
          </h1>
          <p className="mt-1 text-gray-500">
            Fans looking for tickets. Have one to sell? List it and reach out
            through a matching listing.
          </p>
        </div>
        <Link
          href="/wanted/new"
          className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Post a request
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by event or venue..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6 w-full rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />

      {loading && <p className="text-gray-500">Loading requests…</p>}

      {!loading && buyRequests.length === 0 && (
        <p className="text-gray-500">No open requests right now.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buyRequests.map((request) => (
          <BuyRequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
