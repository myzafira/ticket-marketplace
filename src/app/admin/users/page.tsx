"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  nickname: string | null;
  identityVerifiedAt: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { user, loading: loadingSession } = useSession();
  const { t, locale } = useTranslation();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleVerify(target: AdminUser) {
    setPendingId(target.id);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/verify`, {
        method: target.identityVerifiedAt ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === target.id ? { ...u, identityVerifiedAt: data.identityVerifiedAt } : u
          )
        );
      }
    } finally {
      setPendingId(null);
    }
  }

  if (loadingSession) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-700">{t("adminUsers.ownerOnly")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("adminUsers.title")}</h1>
        <Link href="/admin" className="text-sm text-indigo-600 underline">
          {t("adminUsers.backToOverview")}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("adminUsers.searchPlaceholder")}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {t("adminUsers.searchButton")}
        </button>
      </form>

      {!searched && <p className="text-gray-500">{t("adminUsers.prompt")}</p>}
      {searched && users.length === 0 && (
        <p className="text-gray-500">{t("adminUsers.noResults")}</p>
      )}

      {users.length > 0 && (
        <div className="divide-y rounded-lg border bg-white">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">
                  {u.name}
                  {u.nickname && <span className="ml-1 text-gray-400">· {u.nickname}</span>}
                </p>
                <p className="text-sm text-gray-500">
                  {u.email} — {u.phoneNumber}
                </p>
                <p className="mt-1 text-xs">
                  {u.identityVerifiedAt ? (
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      {t("adminUsers.verifiedSince", {
                        date: new Date(u.identityVerifiedAt).toLocaleDateString(dateLocale),
                      })}
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-500">
                      {t("adminUsers.notVerified")}
                    </span>
                  )}
                  <span className="ml-2 text-gray-400">
                    {t("adminUsers.joined", {
                      date: new Date(u.createdAt).toLocaleDateString(dateLocale),
                    })}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggleVerify(u)}
                disabled={pendingId === u.id}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm disabled:opacity-50 ${
                  u.identityVerifiedAt
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {u.identityVerifiedAt
                  ? t("adminUsers.unverifyButton")
                  : t("adminUsers.verifyButton")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
