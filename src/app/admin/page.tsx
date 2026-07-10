"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { formatCents } from "@/lib/format";

type AdminStats = {
  totalOrders: number;
  grossVolumeCents: number;
  platformFeeCents: number;
  sellerPayoutCents: number;
  activeListingCount: number;
  tierBreakdown: { label: string; rate: number; orderCount: number; feeCents: number }[];
  recentOrders: {
    id: string;
    totalCents: number;
    platformFeeCents: number;
    sellerPayoutCents: number;
    createdAt: string;
    listing: { eventName: string; seller: { name: string } };
    buyer: { name: string };
  }[];
};

type MatchNotification = {
  id: string;
  message: string;
  eventName: string;
  eventDate: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  buyRequestId: string;
  listingId: string;
  readAt: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const { user, loading: loadingSession } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/admin/stats").then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load stats");
        return data;
      }),
      fetch("/api/admin/notifications").then((res) => res.json()),
    ])
      .then(([statsData, notificationsData]) => {
        setStats(statsData);
        setNotifications(notificationsData.notifications ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleMarkCalled(id: string) {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      }
    } finally {
      setMarkingId(null);
    }
  }

  if (loadingSession || loading) {
    return <p className="mx-auto max-w-5xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-700">
          You need to{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to view this page.
        </p>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-700">
          This page is only available to the platform owner.
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <p className="mx-auto max-w-5xl px-4 py-8 text-red-600">
        {error ?? "Failed to load stats."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform revenue</h1>
        <Link href="/admin/settings" className="text-sm text-indigo-600 underline">
          Settings
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Match alerts — needs a call
        </h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No matches waiting on a call.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {notifications.map((n) => (
              <div key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {n.eventName} ·{" "}
                      {new Date(n.eventDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Buyer: <span className="font-medium">{n.buyerName}</span>{" "}
                      — {n.buyerPhone} — {n.buyerEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      Seller: <span className="font-medium">{n.sellerName}</span>{" "}
                      — {n.sellerPhone} — {n.sellerEmail}
                    </p>
                    <p className="mt-1 flex gap-3 text-xs">
                      <Link
                        href={`/wanted/${n.buyRequestId}`}
                        className="text-indigo-600 underline"
                      >
                        View request
                      </Link>
                      <Link
                        href={`/listings/${n.listingId}`}
                        className="text-indigo-600 underline"
                      >
                        View listing
                      </Link>
                      <span className="text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  {n.readAt ? (
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      Called
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkCalled(n.id)}
                      disabled={markingId === n.id}
                      className="whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Mark called
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Platform revenue"
          value={formatCents(stats.platformFeeCents)}
          highlight
        />
        <StatCard label="Gross volume" value={formatCents(stats.grossVolumeCents)} />
        <StatCard label="Completed orders" value={String(stats.totalOrders)} />
        <StatCard
          label="Active listings"
          value={String(stats.activeListingCount)}
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Revenue by fee tier
        </h2>
        <div className="divide-y rounded-lg border bg-white">
          {stats.tierBreakdown.map((tier) => (
            <div
              key={tier.label}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{tier.label}</p>
                <p className="text-sm text-gray-500">
                  {(tier.rate * 100).toFixed(0)}% commission ·{" "}
                  {tier.orderCount} order{tier.orderCount === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-semibold text-indigo-600">
                {formatCents(tier.feeCents)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Recent orders
        </h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-gray-500">No completed orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="p-3 font-medium">Event</th>
                  <th className="p-3 font-medium">Seller</th>
                  <th className="p-3 font-medium">Buyer</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 text-right font-medium">Fee</th>
                  <th className="p-3 text-right font-medium">Payout</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-3 text-gray-900">
                      {order.listing.eventName}
                    </td>
                    <td className="p-3 text-gray-500">
                      {order.listing.seller.name}
                    </td>
                    <td className="p-3 text-gray-500">{order.buyer.name}</td>
                    <td className="p-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right text-gray-900">
                      {formatCents(order.totalCents)}
                    </td>
                    <td className="p-3 text-right font-medium text-indigo-600">
                      {formatCents(order.platformFeeCents)}
                    </td>
                    <td className="p-3 text-right text-gray-500">
                      {formatCents(order.sellerPayoutCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          highlight ? "text-indigo-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
