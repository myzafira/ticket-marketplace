"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";

export default function AccountPage() {
  const { user, loading } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
