"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { formatCents } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

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

const REPORT_REASON_KEYS: Record<string, string> = {
  TICKET_NOT_RECEIVED: "reportForm.reasonTicketNotReceived",
  WRONG_OR_INVALID_TICKET: "reportForm.reasonWrongTicket",
  PAYMENT_ISSUE: "reportForm.reasonPaymentIssue",
  OTHER: "reportForm.reasonOther",
};

type OrderReport = {
  id: string;
  reason: string;
  message: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  reporter: { name: string; email: string; phoneNumber: string };
  order: {
    id: string;
    totalCents: number;
    buyer: { name: string; email: string; phoneNumber: string };
    listing: {
      id: string;
      eventName: string;
      seller: { name: string; email: string; phoneNumber: string };
    };
  };
};

type ListingReport = {
  id: string;
  message: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  reporter: { name: string; email: string; phoneNumber: string };
  listing: {
    id: string;
    title: string;
    eventName: string;
    priceCents: number;
    faceValueCents: number | null;
    seller: { name: string; email: string; phoneNumber: string };
  };
};

type FlaggedSeller = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  listingReportCount: number;
  listingRestrictedAt: string | null;
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
  const { t, locale } = useTranslation();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [listingReports, setListingReports] = useState<ListingReport[]>([]);
  const [flaggedSellers, setFlaggedSellers] = useState<FlaggedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingListingId, setResolvingListingId] = useState<string | null>(null);
  const [restrictingId, setRestrictingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/admin/stats").then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(translateApiError(t, data.error, t("admin.failedToLoadStats")));
        return data;
      }),
      fetch("/api/admin/notifications").then((res) => res.json()),
      fetch("/api/admin/reports").then((res) => res.json()),
      fetch("/api/admin/listing-reports").then((res) => res.json()),
      fetch("/api/admin/flagged-sellers").then((res) => res.json()),
    ])
      .then(
        ([
          statsData,
          notificationsData,
          reportsData,
          listingReportsData,
          flaggedSellersData,
        ]) => {
          setStats(statsData);
          setNotifications(notificationsData.notifications ?? []);
          setReports(reportsData.reports ?? []);
          setListingReports(listingReportsData.reports ?? []);
          setFlaggedSellers(flaggedSellersData.sellers ?? []);
        }
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleResolveReport(id: string) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r))
        );
      }
    } finally {
      setResolvingId(null);
    }
  }

  async function handleResolveListingReport(id: string) {
    setResolvingListingId(id);
    try {
      const res = await fetch(`/api/admin/listing-reports/${id}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        setListingReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r))
        );
      }
    } finally {
      setResolvingListingId(null);
    }
  }

  async function handleToggleRestrict(seller: FlaggedSeller) {
    setRestrictingId(seller.id);
    try {
      const res = await fetch(`/api/admin/users/${seller.id}/restrict`, {
        method: seller.listingRestrictedAt ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setFlaggedSellers((prev) =>
          prev.map((s) =>
            s.id === seller.id
              ? { ...s, listingRestrictedAt: data.listingRestrictedAt }
              : s
          )
        );
      }
    } finally {
      setRestrictingId(null);
    }
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-5xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <Link href="/login" className="text-indigo-600 underline">
            {t("common.logIn")}
          </Link>{" "}
          {t("common.needLoginSuffixGeneric")}
        </p>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-700">{t("admin.ownerOnly")}</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <p className="mx-auto max-w-5xl px-4 py-8 text-red-600">
        {error ?? t("admin.failedToLoadStats")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.platformRevenue")}</h1>
        <div className="flex gap-4">
          <Link href="/admin/users" className="text-sm text-indigo-600 underline">
            {t("adminUsers.title")}
          </Link>
          <Link href="/admin/settings" className="text-sm text-indigo-600 underline">
            {t("admin.settings")}
          </Link>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.orderReportsTitle")}
        </h2>
        {reports.filter((r) => r.status === "OPEN").length === 0 ? (
          <p className="text-gray-500">{t("admin.noOpenReports")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {reports
              .filter((r) => r.status === "OPEN")
              .map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {r.order.listing.eventName} ·{" "}
                        {REPORT_REASON_KEYS[r.reason] ? t(REPORT_REASON_KEYS[r.reason]) : r.reason}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {t("admin.reportedBy", {
                          name: r.reporter.name,
                          email: r.reporter.email,
                          phone: r.reporter.phoneNumber,
                        })}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{r.message}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {t("admin.buyerLine", {
                          name: r.order.buyer.name,
                          email: r.order.buyer.email,
                          phone: r.order.buyer.phoneNumber,
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("admin.sellerLine", {
                          name: r.order.listing.seller.name,
                          email: r.order.listing.seller.email,
                          phone: r.order.listing.seller.phoneNumber,
                        })}
                      </p>
                      <p className="mt-1 flex gap-3 text-xs">
                        <Link
                          href={`/listings/${r.order.listing.id}`}
                          className="text-indigo-600 underline"
                        >
                          {t("admin.viewListing")}
                        </Link>
                        <span className="text-gray-400">
                          {new Date(r.createdAt).toLocaleString(dateLocale)}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolveReport(r.id)}
                      disabled={resolvingId === r.id}
                      className="whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {t("admin.markResolved")}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.listingReportsTitle")}
        </h2>
        {listingReports.filter((r) => r.status === "OPEN").length === 0 ? (
          <p className="text-gray-500">{t("admin.noOpenListingReports")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {listingReports
              .filter((r) => r.status === "OPEN")
              .map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {r.listing.eventName} — {r.listing.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {t("admin.reportedBy", {
                          name: r.reporter.name,
                          email: r.reporter.email,
                          phone: r.reporter.phoneNumber,
                        })}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{r.message}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {t("admin.listingPriceLine", {
                          price: formatCents(r.listing.priceCents),
                          faceValue: r.listing.faceValueCents
                            ? formatCents(r.listing.faceValueCents)
                            : "—",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("admin.sellerLine", {
                          name: r.listing.seller.name,
                          email: r.listing.seller.email,
                          phone: r.listing.seller.phoneNumber,
                        })}
                      </p>
                      <p className="mt-1 flex gap-3 text-xs">
                        <Link
                          href={`/listings/${r.listing.id}`}
                          className="text-indigo-600 underline"
                        >
                          {t("admin.viewListing")}
                        </Link>
                        <span className="text-gray-400">
                          {new Date(r.createdAt).toLocaleString(dateLocale)}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolveListingReport(r.id)}
                      disabled={resolvingListingId === r.id}
                      className="whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {t("admin.markResolved")}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.flaggedSellersTitle")}
        </h2>
        {flaggedSellers.length === 0 ? (
          <p className="text-gray-500">{t("admin.noFlaggedSellers")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {flaggedSellers.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {s.name} — {s.email} — {s.phoneNumber}
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {t("admin.listingReportCount", { count: s.listingReportCount })}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleRestrict(s)}
                  disabled={restrictingId === s.id}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-sm disabled:opacity-50 ${
                    s.listingRestrictedAt
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {s.listingRestrictedAt
                    ? t("adminUsers.unrestrictButton")
                    : t("adminUsers.restrictButton")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.matchAlertsTitle")}
        </h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">{t("admin.noMatches")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {notifications.map((n) => (
              <div key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {n.eventName} ·{" "}
                      {new Date(n.eventDate).toLocaleDateString(dateLocale)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t("admin.buyerLine", {
                        name: n.buyerName,
                        email: n.buyerEmail,
                        phone: n.buyerPhone,
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("admin.sellerLine", {
                        name: n.sellerName,
                        email: n.sellerEmail,
                        phone: n.sellerPhone,
                      })}
                    </p>
                    <p className="mt-1 flex gap-3 text-xs">
                      <Link
                        href={`/wanted/${n.buyRequestId}`}
                        className="text-indigo-600 underline"
                      >
                        {t("admin.viewRequest")}
                      </Link>
                      <Link
                        href={`/listings/${n.listingId}`}
                        className="text-indigo-600 underline"
                      >
                        {t("admin.viewListing")}
                      </Link>
                      <span className="text-gray-400">
                        {new Date(n.createdAt).toLocaleString(dateLocale)}
                      </span>
                    </p>
                  </div>
                  {n.readAt ? (
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      {t("admin.called")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkCalled(n.id)}
                      disabled={markingId === n.id}
                      className="whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {t("admin.markCalled")}
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
          label={t("admin.platformRevenue")}
          value={formatCents(stats.platformFeeCents)}
          highlight
        />
        <StatCard label={t("admin.grossVolume")} value={formatCents(stats.grossVolumeCents)} />
        <StatCard label={t("admin.completedOrders")} value={String(stats.totalOrders)} />
        <StatCard
          label={t("admin.activeListings")}
          value={String(stats.activeListingCount)}
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.revenueByTier")}
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
                  {t(
                    tier.orderCount === 1 ? "admin.commission" : "admin.commissionPlural",
                    { rate: (tier.rate * 100).toFixed(1), count: tier.orderCount }
                  )}
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
          {t("admin.recentOrders")}
        </h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-gray-500">{t("admin.noCompletedOrders")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="p-3 font-medium">{t("admin.colEvent")}</th>
                  <th className="p-3 font-medium">{t("admin.colSeller")}</th>
                  <th className="p-3 font-medium">{t("admin.colBuyer")}</th>
                  <th className="p-3 font-medium">{t("admin.colDate")}</th>
                  <th className="p-3 text-right font-medium">{t("admin.colTotal")}</th>
                  <th className="p-3 text-right font-medium">{t("admin.colFee")}</th>
                  <th className="p-3 text-right font-medium">{t("admin.colPayout")}</th>
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
                      {new Date(order.createdAt).toLocaleDateString(dateLocale)}
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
