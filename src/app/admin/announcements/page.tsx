"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import { useToast } from "@/components/ToastContext";

type Priority = "CRITICAL" | "GENERAL";
type Audience = "USERS" | "ADMINS";

type Announcement = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  priority: Priority;
  audience: Audience;
  isActive: boolean;
  publishAt: string;
  expiresAt: string | null;
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  title: "",
  body: "",
  linkUrl: "",
  linkLabel: "",
  priority: "GENERAL" as Priority,
  audience: "USERS" as Audience,
  isActive: true,
  publishAt: toLocalInputValue(new Date().toISOString()),
  expiresAt: "",
};

export default function AdminAnnouncementsPage() {
  const { user, loading: loadingSession } = useSession();
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.permissions.includes("MANAGE_ANNOUNCEMENTS")) {
      setLoading(false);
      return;
    }
    fetch("/api/admin/announcements")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            translateApiError(t, data.error, t("adminAnnouncements.failedToLoad"))
          );
        setAnnouncements(data.announcements ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      linkUrl: a.linkUrl ?? "",
      linkLabel: a.linkLabel ?? "",
      priority: a.priority,
      audience: a.audience,
      isActive: a.isActive,
      publishAt: toLocalInputValue(a.publishAt),
      expiresAt: a.expiresAt ? toLocalInputValue(a.expiresAt) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        linkUrl: form.linkUrl,
        linkLabel: form.linkLabel,
        priority: form.priority,
        audience: form.audience,
        isActive: form.isActive,
        publishAt: new Date(form.publishAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : "",
      };
      const res = await fetch(
        editingId ? `/api/admin/announcements/${editingId}` : "/api/admin/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(translateApiError(t, data.error, t("adminAnnouncements.failedToSave")));

      if (editingId) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? data.announcement : a))
        );
      } else {
        setAnnouncements((prev) => [data.announcement, ...prev]);
      }
      cancelEdit();
      showToast(t("adminAnnouncements.saved"), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        if (editingId === id) cancelEdit();
      } else {
        showToast(t("adminAnnouncements.failedToDelete"), "error");
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleActive(a: Announcement) {
    setPendingId(a.id);
    try {
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: a.title,
          body: a.body,
          linkUrl: a.linkUrl ?? "",
          linkLabel: a.linkLabel ?? "",
          priority: a.priority,
          audience: a.audience,
          isActive: !a.isActive,
          publishAt: a.publishAt,
          expiresAt: a.expiresAt ?? "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? data.announcement : x)));
      } else {
        showToast(t("adminAnnouncements.failedToSave"), "error");
      }
    } finally {
      setPendingId(null);
    }
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-gray-500">{t("common.loading")}</p>
    );
  }

  if (!user?.permissions.includes("MANAGE_ANNOUNCEMENTS")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-700">{t("admin.ownerOnly")}</p>
      </div>
    );
  }

  if (error) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>;
  }

  function statusBadge(a: Announcement) {
    const now = new Date();
    if (!a.isActive) {
      return (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {t("adminAnnouncements.statusInactive")}
        </span>
      );
    }
    if (a.expiresAt && new Date(a.expiresAt) <= now) {
      return (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {t("adminAnnouncements.statusExpired")}
        </span>
      );
    }
    if (new Date(a.publishAt) > now) {
      return (
        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {t("adminAnnouncements.statusScheduled")}
        </span>
      );
    }
    return (
      <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        {t("adminAnnouncements.statusActive")}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("adminAnnouncements.title")}</h1>
        <Link href="/admin" className="text-sm text-indigo-600 underline">
          {t("adminSettings.backToOverview")}
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-10 space-y-4 rounded-lg border bg-white p-4"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {editingId ? t("adminAnnouncements.editTitle") : t("adminAnnouncements.createTitle")}
        </h2>
        <input
          required
          maxLength={200}
          placeholder={t("adminAnnouncements.titlePlaceholder")}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="input"
        />
        <textarea
          required
          rows={3}
          maxLength={2000}
          placeholder={t("adminAnnouncements.bodyPlaceholder")}
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
          className="input"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="url"
            placeholder={t("adminAnnouncements.linkUrlPlaceholder")}
            value={form.linkUrl}
            onChange={(e) => update("linkUrl", e.target.value)}
            className="input"
          />
          <input
            maxLength={100}
            placeholder={t("adminAnnouncements.linkLabelPlaceholder")}
            value={form.linkLabel}
            onChange={(e) => update("linkLabel", e.target.value)}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t("adminAnnouncements.priorityLabel")}
            </span>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as Priority)}
              className="input"
            >
              <option value="CRITICAL">{t("adminAnnouncements.priorityCritical")}</option>
              <option value="GENERAL">{t("adminAnnouncements.priorityGeneral")}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t("adminAnnouncements.audienceLabel")}
            </span>
            <select
              value={form.audience}
              onChange={(e) => update("audience", e.target.value as Audience)}
              className="input"
            >
              <option value="USERS">{t("adminAnnouncements.audienceUsers")}</option>
              <option value="ADMINS">{t("adminAnnouncements.audienceAdmins")}</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t("adminAnnouncements.publishAtLabel")}
            </span>
            <input
              type="datetime-local"
              required
              value={form.publishAt}
              onChange={(e) => update("publishAt", e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {t("adminAnnouncements.expiresAtLabel")}
            </span>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => update("expiresAt", e.target.value)}
              className="input"
            />
            <span className="mt-1 block text-xs text-gray-400">
              {t("adminAnnouncements.expiresAtHint")}
            </span>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
          />
          {t("adminAnnouncements.activeLabel")}
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving
              ? t("common.saving")
              : editingId
                ? t("adminAnnouncements.updateButton")
                : t("adminAnnouncements.createButton")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
            >
              {t("adminAnnouncements.cancelEditButton")}
            </button>
          )}
        </div>
      </form>

      {announcements.length === 0 ? (
        <p className="text-gray-500">{t("adminAnnouncements.listEmpty")}</p>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {announcements.map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        a.priority === "CRITICAL"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {a.priority === "CRITICAL"
                        ? t("adminAnnouncements.priorityCritical")
                        : t("adminAnnouncements.priorityGeneral")}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {a.audience === "USERS"
                        ? t("adminAnnouncements.audienceUsers")
                        : t("adminAnnouncements.audienceAdmins")}
                    </span>
                    {statusBadge(a)}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{a.body}</p>
                  {a.linkUrl && (
                    <p className="mt-1 text-xs text-indigo-600 underline">
                      {a.linkLabel || a.linkUrl}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {t("adminAnnouncements.publishAtLabel")}:{" "}
                    {new Date(a.publishAt).toLocaleString(dateLocale)}
                    {a.expiresAt && (
                      <>
                        {" · "}
                        {t("adminAnnouncements.expiresAtLabel")}:{" "}
                        {new Date(a.expiresAt).toLocaleString(dateLocale)}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                  >
                    {t("adminAnnouncements.editButton")}
                  </button>
                  <button
                    onClick={() => handleToggleActive(a)}
                    disabled={pendingId === a.id}
                    className="whitespace-nowrap rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {a.isActive
                      ? t("adminAnnouncements.deactivateButton")
                      : t("adminAnnouncements.activateButton")}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={pendingId === a.id}
                    className="whitespace-nowrap rounded bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {t("adminAnnouncements.deleteButton")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
