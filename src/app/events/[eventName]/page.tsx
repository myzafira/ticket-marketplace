"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type SoldOrder = {
  id: string;
  priceCents: number;
  quantity: number;
  venue: string;
  eventDate: string;
  soldAt: string;
};

type ActiveListing = {
  id: string;
  priceCents: number;
  quantity: number;
  venue: string;
  eventDate: string;
  createdAt: string;
};

export default function EventPriceHistoryPage({
  params,
}: {
  params: Promise<{ eventName: string }>;
}) {
  const { eventName: encodedEventName } = use(params);
  const eventName = decodeURIComponent(encodedEventName);
  const { t, locale } = useTranslation();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [soldOrders, setSoldOrders] = useState<SoldOrder[]>([]);
  const [activeListings, setActiveListings] = useState<ActiveListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/price-history?eventName=${encodeURIComponent(eventName)}`)
      .then((res) => res.json())
      .then((data) => {
        setSoldOrders(data.soldOrders ?? []);
        setActiveListings(data.activeListings ?? []);
      })
      .finally(() => setLoading(false));
  }, [eventName]);

  if (loading) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{eventName}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("priceHistory.subtitle")}</p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("priceHistory.soldTitle")}
        </h2>
        {soldOrders.length === 0 ? (
          <p className="text-gray-500">{t("priceHistory.noSold")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="p-3 font-medium">{t("priceHistory.colVenue")}</th>
                  <th className="p-3 font-medium">{t("priceHistory.colSoldOn")}</th>
                  <th className="p-3 text-right font-medium">{t("priceHistory.colQuantity")}</th>
                  <th className="p-3 text-right font-medium">{t("priceHistory.colPrice")}</th>
                </tr>
              </thead>
              <tbody>
                {soldOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="p-3 text-gray-900">{o.venue}</td>
                    <td className="p-3 text-gray-500">
                      {new Date(o.soldAt).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="p-3 text-right text-gray-500">{o.quantity}</td>
                    <td className="p-3 text-right font-medium text-indigo-600">
                      {formatCents(o.priceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("priceHistory.activeTitle")}
        </h2>
        {activeListings.length === 0 ? (
          <p className="text-gray-500">{t("priceHistory.noActive")}</p>
        ) : (
          <div className="divide-y rounded-lg border bg-white">
            {activeListings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{l.venue}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(l.eventDate).toLocaleDateString(dateLocale)}
                  </p>
                </div>
                <p className="font-semibold text-indigo-600">
                  {formatCents(l.priceCents)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
