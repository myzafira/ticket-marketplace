import Link from "next/link";
import { formatCents } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  const eventDate = new Date(listing.eventDate);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
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
              {eventDate.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            {listing.section && (
              <p className="mt-1 text-xs text-gray-400">
                Section {listing.section}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600">
            {formatCents(listing.priceCents)}
          </p>
          <p className="text-xs text-gray-400">
            {listing.quantity} ticket{listing.quantity > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
