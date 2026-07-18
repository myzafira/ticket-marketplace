"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import StarRating from "@/components/StarRating";
import FavoriteButton from "@/components/FavoriteButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Listing } from "@/lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  const { t, locale } = useTranslation();
  const eventDate = new Date(listing.eventDate);
  const [isFavorited, setIsFavorited] = useState(Boolean(listing.isFavorited));

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative block rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="absolute right-3 top-3">
        <FavoriteButton
          listingId={listing.id}
          isFavorited={isFavorited}
          onChange={setIsFavorited}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          {listing.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {listing.eventName}
            </h3>
            <p className="text-sm text-gray-500">{listing.venue}</p>
            <p className="mt-1 text-sm text-gray-500">
              {eventDate.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            {listing.section && (
              <p className="mt-1 text-xs text-gray-400">
                {t("listingCard.section", { section: listing.section })}
              </p>
            )}
            {listing.seller.rating && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                <StarRating summary={listing.seller.rating} />
                {listing.seller.isVerified && <VerifiedBadge />}
              </p>
            )}
            {Boolean(listing.seller.salesCount) && (
              <p className="mt-1 text-xs text-gray-400">
                {t(
                  listing.seller.salesCount === 1
                    ? "trust.soldCount"
                    : "trust.soldCountPlural",
                  { count: listing.seller.salesCount! }
                )}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600">
            {formatCents(listing.priceCents)}
          </p>
          <p className="text-xs text-gray-400">
            {t(
              listing.quantity > 1 ? "listingCard.ticketsPlural" : "listingCard.tickets",
              { count: listing.quantity }
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
