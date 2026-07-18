"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function TicketProofUploader({
  orderId,
  imageUrl,
  onUploaded,
}: {
  orderId: string;
  imageUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok)
        throw new Error(
          translateApiError(t, uploadData.error, t("ticketProofUploader.failedToUpload"))
        );

      const patchRes = await fetch(`/api/orders/${orderId}/ticket-proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok)
        throw new Error(
          translateApiError(t, patchData.error, t("ticketProofUploader.failedToSave"))
        );
      onUploaded(patchData.ticketProofUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setUploading(false);
    }
  }

  if (imageUrl) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 underline"
        >
          {t("ticketProofUploader.viewTicket")}
        </a>
        <label className="cursor-pointer text-gray-500 underline">
          {uploading ? t("ticketProofUploader.uploading") : t("ticketProofUploader.replace")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <label className="inline-block cursor-pointer rounded bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200">
        {uploading ? t("ticketProofUploader.uploading") : t("ticketProofUploader.uploadForBuyer")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
