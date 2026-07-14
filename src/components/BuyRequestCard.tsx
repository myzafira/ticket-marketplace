import Link from "next/link";
import { formatCents } from "@/lib/format";
import StarRating from "@/components/StarRating";
import type { BuyRequest } from "@/lib/types";

export default function BuyRequestCard({
  request,
}: {
  request: BuyRequest;
}) {
  const eventDate = new Date(request.eventDate);

  return (
    <Link
      href={`/wanted/${request.id}`}
      className="block rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          {request.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={request.imageUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded object-cover"
            />
          )}
          <div>
            <span className="mb-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Wanted
            </span>
            <h3 className="font-semibold text-gray-900">
              {request.eventName}
            </h3>
            {request.venue && (
              <p className="text-sm text-gray-500">{request.venue}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {eventDate.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            {request.buyer.rating && (
              <p className="mt-1">
                <StarRating summary={request.buyer.rating} />
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600">
            up to {formatCents(request.maxPriceCents)}
          </p>
          <p className="text-xs text-gray-400">
            {request.quantity} ticket{request.quantity > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
