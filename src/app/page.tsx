"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Listing } from "@/lib/types";

type SortOption = "date_asc" | "date_desc" | "price_asc" | "price_desc";

const EMPTY_FILTERS = {
  minPrice: "",
  maxPrice: "",
  dateFrom: "",
  dateTo: "",
  section: "",
};

export default function HomePage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>("date_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.section) params.set("section", filters.section);
    if (sort !== "date_asc") params.set("sort", sort);

    fetch(`/api/listings${params.toString() ? `?${params.toString()}` : ""}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setListings(data.listings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, filters, sort]);

  function updateFilter<K extends keyof typeof filters>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("home.title")}</h1>
        <p className="mt-1 text-gray-500">{t("home.subtitle")}</p>
      </div>

      <input
        type="text"
        placeholder={t("home.searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 w-full rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
      />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="text-sm font-medium text-indigo-600 underline"
          >
            {showFilters ? t("home.hideFilters") : t("home.filters")}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">{t("home.sortBy")}</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="date_asc">{t("home.sortDateAsc")}</option>
              <option value="date_desc">{t("home.sortDateDesc")}</option>
              <option value="price_asc">{t("home.sortPriceAsc")}</option>
              <option value="price_desc">{t("home.sortPriceDesc")}</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border bg-white p-4 sm:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                {t("home.minPrice")}
              </span>
              <input
                type="number"
                min={0}
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                className="input text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                {t("home.maxPrice")}
              </span>
              <input
                type="number"
                min={0}
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                className="input text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                {t("home.dateFrom")}
              </span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="input text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                {t("home.dateTo")}
              </span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="input text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                {t("home.section")}
              </span>
              <input
                type="text"
                placeholder={t("home.sectionPlaceholder")}
                value={filters.section}
                onChange={(e) => updateFilter("section", e.target.value)}
                className="input text-sm"
              />
            </label>
            {hasActiveFilters && (
              <div className="col-span-2 flex items-end sm:col-span-5">
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-xs text-gray-500 underline"
                >
                  {t("home.clearFilters")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500">{t("home.loading")}</p>}

      {!loading && listings.length === 0 && (
        <p className="text-gray-500">{t("home.empty")}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
