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

type TasksSummary = {
  openOrderReports: number;
  openListingReports: number;
  unreadMatches: number;
  flaggedSellers: number;
  total: number;
};

const ACTIVITY_ACTION_KEYS: Record<string, string> = {
  USER_VERIFIED: "admin.activityUserVerified",
  USER_UNVERIFIED: "admin.activityUserUnverified",
  SELLER_RESTRICTED: "admin.activitySellerRestricted",
  SELLER_UNRESTRICTED: "admin.activitySellerUnrestricted",
  ORDER_REPORT_RESOLVED: "admin.activityOrderReportResolved",
  LISTING_REPORT_RESOLVED: "admin.activityListingReportResolved",
  MATCH_MARKED_CALLED: "admin.activityMatchCalled",
  SETTINGS_UPDATED: "admin.activitySettingsUpdated",
  ANNOUNCEMENT_CREATED: "admin.activityAnnouncementCreated",
  ANNOUNCEMENT_UPDATED: "admin.activityAnnouncementUpdated",
  ANNOUNCEMENT_DELETED: "admin.activityAnnouncementDeleted",
  USER_ROLE_CHANGED: "admin.activityUserRoleChanged",
  PERMISSIONS_UPDATED: "admin.activityPermissionsUpdated",
};

type AdminActivityEntry = {
  id: string;
  action: string;
  targetLabel: string | null;
  createdAt: string;
  admin: { name: string };
};

export default function AdminPage() {
  const { user, loading: loadingSession } = useSession();
  const { t, locale } = useTranslation();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tasksSummary, setTasksSummary] = useState<TasksSummary | null>(null);
  const [activity, setActivity] = useState<AdminActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([
      user.permissions.includes("VIEW_STATS")
        ? fetch("/api/admin/stats").then(async (res) => {
            const data = await res.json();
            if (!res.ok)
              throw new Error(translateApiError(t, data.error, t("admin.failedToLoadStats")));
            return data;
          })
        : Promise.resolve(null),
      fetch("/api/admin/tasks/summary").then((res) => res.json()),
      fetch("/api/admin/activity").then((res) => res.json()),
    ])
      .then(([statsData, tasksSummaryData, activityData]) => {
        setStats(statsData);
        setTasksSummary(tasksSummaryData);
        setActivity(activityData.entries ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  if (error) {
    return <p className="mx-auto max-w-5xl px-4 py-8 text-red-600">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.platformRevenue")}</h1>
        <div className="flex gap-4">
          {user.permissions.includes("MANAGE_USERS") && (
            <Link href="/admin/users" className="text-sm text-indigo-600 underline">
              {t("adminUsers.title")}
            </Link>
          )}
          {user.permissions.includes("MANAGE_ANNOUNCEMENTS") && (
            <Link href="/admin/announcements" className="text-sm text-indigo-600 underline">
              {t("adminAnnouncements.title")}
            </Link>
          )}
          {user.isFullAdmin && (
            <Link href="/admin/permissions" className="text-sm text-indigo-600 underline">
              {t("adminPermissions.title")}
            </Link>
          )}
          {user.permissions.includes("MANAGE_SETTINGS") && (
            <Link href="/admin/settings" className="text-sm text-indigo-600 underline">
              {t("admin.settings")}
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/admin/tasks"
        className="mb-10 flex items-center justify-between rounded-lg border bg-white p-4 hover:bg-gray-50"
      >
        <div>
          <p className="font-medium text-gray-900">{t("admin.tasksPageTitle")}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {tasksSummary
              ? t("admin.tasksCount", { count: tasksSummary.total })
              : t("common.loading")}
          </p>
        </div>
        {tasksSummary && tasksSummary.total > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            {tasksSummary.total}
          </span>
        )}
      </Link>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("admin.activityTitle")}
        </h2>
        {activity.length === 0 ? (
          <p className="text-gray-500">{t("admin.noActivity")}</p>
        ) : (
          <div className="max-h-80 divide-y overflow-y-auto rounded-lg border bg-white">
            {activity.map((entry) => (
              <div key={entry.id} className="p-3 text-sm">
                <p className="text-gray-800">
                  {t(ACTIVITY_ACTION_KEYS[entry.action] ?? entry.action, {
                    admin: entry.admin.name,
                    target: entry.targetLabel ?? "",
                  })}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(entry.createdAt).toLocaleString(dateLocale)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {stats && (
        <>
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label={t("admin.platformRevenue")}
              value={formatCents(stats.platformFeeCents)}
              highlight
            />
            <StatCard
              label={t("admin.grossVolume")}
              value={formatCents(stats.grossVolumeCents)}
            />
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
                <div key={tier.label} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">{tier.label}</p>
                    <p className="text-sm text-gray-500">
                      {t(
                        tier.orderCount === 1 ? "admin.commission" : "admin.commissionPlural",
                        { rate: (tier.rate * 100).toFixed(1), count: tier.orderCount }
                      )}
                    </p>
                  </div>
                  <p className="font-semibold text-indigo-600">{formatCents(tier.feeCents)}</p>
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
                        <td className="p-3 text-gray-900">{order.listing.eventName}</td>
                        <td className="p-3 text-gray-500">{order.listing.seller.name}</td>
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
        </>
      )}
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
