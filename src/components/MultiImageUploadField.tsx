"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";

export default function MultiImageUploadField({
  label,
  imageUrls,
  max,
  onChange,
}: {
  label: string;
  imageUrls: string[];
  max: number;
  onChange: (urls: string[]) => void;
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          translateApiError(t, data.error, t("imageUpload.failedToUpload"))
        );
      onChange([...imageUrls, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(url: string) {
    onChange(imageUrls.filter((u) => u !== url));
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>

      {imageUrls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Uploaded"
                className="h-20 w-20 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                aria-label={t("imageUpload.remove")}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs text-white hover:bg-gray-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {imageUrls.length < max && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="input"
        />
      )}

      <p className="mt-1 text-xs text-gray-400">
        {t("imageUpload.countHint", { count: imageUrls.length, max })}
      </p>
      {uploading && (
        <p className="mt-1 text-xs text-gray-400">{t("imageUpload.uploading")}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
