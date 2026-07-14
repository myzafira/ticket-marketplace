"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";

export default function AccountPage() {
  const { user, loading, refresh } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState<string | null>(null);
  const [savingNickname, setSavingNickname] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault();
    setNicknameError(null);
    setNicknameSuccess(null);
    setSavingNickname(true);
    try {
      const res = await fetch("/api/account/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save nickname");
      setNicknameSuccess(`Saved — you'll appear as #${data.handle}`);
      await refresh();
    } catch (err) {
      setNicknameError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSavingNickname(false);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-sm px-4 py-12 text-gray-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="text-gray-700">
          You need to{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Account</h1>
      <p className="mb-6 text-sm text-gray-500">
        Signed in as {user.name} ({user.email})
      </p>

      <h2 className="mb-1 font-semibold text-gray-900">Public nickname</h2>
      <p className="mb-3 text-sm text-gray-500">
        Shown to other buyers/sellers instead of a random code, e.g.{" "}
        <span className="font-medium">TicketFan88-A1B2</span>. Don&apos;t use
        your real name or any contact info — it&apos;s still checked and
        blocked either way.
      </p>
      <form onSubmit={handleSaveNickname} className="mb-8 flex gap-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. TicketFan88"
          maxLength={20}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={savingNickname}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {savingNickname ? "Saving…" : "Save"}
        </button>
      </form>
      {nicknameError && (
        <p className="-mt-6 mb-6 text-sm text-red-600">{nicknameError}</p>
      )}
      {nicknameSuccess && (
        <p className="-mt-6 mb-6 text-sm text-green-600">{nicknameSuccess}</p>
      )}

      <h2 className="mb-3 font-semibold text-gray-900">Change password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">Password changed.</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
