"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type Announcement = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
};

type Visible = { critical: Announcement | null; general: Announcement[] } | null;

const CAROUSEL_INTERVAL_MS = 6000;

export default function AnnouncementBanner({ scope }: { scope: "users" | "admins" }) {
  const { t } = useTranslation();
  const [data, setData] = useState<Visible>(null);
  const [criticalDismissed, setCriticalDismissed] = useState(false);
  const [generalDismissed, setGeneralDismissed] = useState(false);
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((json) => setData(scope === "users" ? json.users : json.admins))
      .catch(() => {});
  }, [scope]);

  const general = data?.general ?? [];

  useEffect(() => {
    if (general.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % general.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [general.length]);

  if (!data) return null;

  const { critical } = data;

  return (
    <div>
      {critical && !criticalDismissed && (
        <div className="bg-amber-500 px-4 py-2.5 text-sm text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-semibold">{critical.title}</span>
              <span className="ml-2 opacity-90">{critical.body}</span>
              {critical.linkUrl && (
                <a
                  href={critical.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 whitespace-nowrap underline"
                >
                  {critical.linkLabel || t("announcement.learnMore")}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCriticalDismissed(true)}
              aria-label={t("announcement.dismiss")}
              className="shrink-0 text-lg leading-none opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {general.length > 0 && !generalDismissed && (
        <div className="bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {general.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s - 1 + general.length) % general.length)}
                  aria-label={t("announcement.previous")}
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  ‹
                </button>
              )}
              <div className="min-w-0">
                <span className="font-medium">{general[slide]?.title}</span>
                <span className="ml-2 opacity-90">{general[slide]?.body}</span>
                {general[slide]?.linkUrl && (
                  <a
                    href={general[slide]!.linkUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 whitespace-nowrap underline"
                  >
                    {general[slide]!.linkLabel || t("announcement.learnMore")}
                  </a>
                )}
              </div>
              {general.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s + 1) % general.length)}
                  aria-label={t("announcement.next")}
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  ›
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setGeneralDismissed(true)}
              aria-label={t("announcement.dismiss")}
              className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
