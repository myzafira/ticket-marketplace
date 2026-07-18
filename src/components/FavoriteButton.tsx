"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function FavoriteButton({
  listingId,
  isFavorited,
  onChange,
  size = "sm",
}: {
  listingId: string;
  isFavorited: boolean;
  onChange?: (isFavorited: boolean) => void;
  size?: "sm" | "md";
}) {
  const { user } = useSession();
  const { t } = useTranslation();
  const [favorited, setFavorited] = useState(isFavorited);
  const [pending, setPending] = useState(false);

  if (!user) return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch(`/api/listings/${listingId}/favorite`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error(t("favorite.failedToUpdate"));
      onChange?.(next);
    } catch {
      setFavorited(!next);
    } finally {
      setPending(false);
    }
  }

  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? t("favorite.saved") : t("favorite.save")}
      title={favorited ? t("favorite.saved") : t("favorite.save")}
      className={`${textSize} leading-none transition disabled:opacity-50 ${
        favorited ? "text-amber-500" : "text-gray-300 hover:text-amber-400"
      }`}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
