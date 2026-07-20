"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ToastContext";

type Role = "EXECUTIVE_ADMIN" | "STAFF";
type Permission =
  | "MANAGE_USERS"
  | "RESOLVE_REPORTS"
  | "MARK_MATCHES_CALLED"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_SETTINGS"
  | "VIEW_STATS";

type MatrixRow = { role: Role; permissions: { permission: Permission; granted: boolean }[] };

const ROLES: Role[] = ["EXECUTIVE_ADMIN", "STAFF"];
const PERMISSIONS: Permission[] = [
  "MANAGE_USERS",
  "RESOLVE_REPORTS",
  "MARK_MATCHES_CALLED",
  "MANAGE_ANNOUNCEMENTS",
  "MANAGE_SETTINGS",
  "VIEW_STATS",
];

export default function AdminPermissionsPage() {
  const { user, loading: loadingSession } = useSession();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isFullAdmin) {
      setLoading(false);
      return;
    }
    fetch("/api/admin/permissions")
      .then((res) => res.json())
      .then((data) => setMatrix(data.matrix ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  function isGranted(role: Role, permission: Permission) {
    return (
      matrix.find((r) => r.role === role)?.permissions.find((p) => p.permission === permission)
        ?.granted ?? false
    );
  }

  async function toggle(role: Role, permission: Permission) {
    const key = `${role}:${permission}`;
    const next = !isGranted(role, permission);
    setPendingKey(key);
    setMatrix((prev) =>
      prev.map((r) =>
        r.role === role
          ? {
              ...r,
              permissions: r.permissions.map((p) =>
                p.permission === permission ? { ...p, granted: next } : p
              ),
            }
          : r
      )
    );
    try {
      const res = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permission, granted: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert on failure
      setMatrix((prev) =>
        prev.map((r) =>
          r.role === role
            ? {
                ...r,
                permissions: r.permissions.map((p) =>
                  p.permission === permission ? { ...p, granted: !next } : p
                ),
              }
            : r
        )
      );
      showToast(t("adminPermissions.failedToSave"), "error");
    } finally {
      setPendingKey(null);
    }
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-gray-500">{t("common.loading")}</p>
    );
  }

  if (!user?.isFullAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-700">{t("adminPermissions.fullAdminOnly")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("adminPermissions.title")}</h1>
        <Link href="/admin" className="text-sm text-indigo-600 underline">
          {t("adminSettings.backToOverview")}
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-500">{t("adminPermissions.subtitle")}</p>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3 font-medium">{t("adminPermissions.colPermission")}</th>
              {ROLES.map((role) => (
                <th key={role} className="p-3 text-center font-medium">
                  {t(`adminPermissions.role${role}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission} className="border-b last:border-0">
                <td className="p-3 text-gray-900">
                  {t(`adminPermissions.perm${permission}`)}
                </td>
                {ROLES.map((role) => {
                  const key = `${role}:${permission}`;
                  return (
                    <td key={role} className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isGranted(role, permission)}
                        disabled={pendingKey === key}
                        onChange={() => toggle(role, permission)}
                        className="h-4 w-4"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">{t("adminPermissions.fullAdminNote")}</p>
    </div>
  );
}
