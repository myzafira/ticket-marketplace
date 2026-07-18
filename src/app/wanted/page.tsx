"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BuyRequestCard from "@/components/BuyRequestCard";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { BuyRequest } from "@/lib/types";

export default function WantedPage() {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-gray-900">{t("wanted.title")}</h1>
          <p className="mt-1 text-gray-500">{t("wanted.subtitle")}</p>
        </div>
        <Link
          href="/wanted/new"
          className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("wanted.postRequest")}
        </Link>
      </div>

      <input
        type="text"
        placeholder={t("wanted.searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6 w-full rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />

      {loading && <p className="text-gray-500">{t("wanted.loading")}</p>}

      {!loading && buyRequests.length === 0 && (
        <p className="text-gray-500">{t("wanted.empty")}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buyRequests.map((request) => (
          <BuyRequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
