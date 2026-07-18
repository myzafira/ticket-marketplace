"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function ImageUploadField({
  label,
  imageUrl,
  onChange,
}: {
  label: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("imageUpload.failedToUpload"))
        );
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {imageUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded"
            className="h-20 w-20 rounded-lg border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            {t("imageUpload.remove")}
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="input"
        />
      )}

      {uploading && (
        <p className="mt-1 text-xs text-gray-400">{t("imageUpload.uploading")}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
