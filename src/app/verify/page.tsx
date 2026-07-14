"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

export default function VerifyPage() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();

  const [emailCode, setEmailCode] = useState("");
  const [devEmailCode, setDevEmailCode] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("devVerificationCodes");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDevEmailCode(parsed.email ?? null);
      } catch {
        // ignore malformed session data
      }
      sessionStorage.removeItem("devVerificationCodes");
    }
  }, []);

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-code", { method: "POST" });
      const data = await res.json();
      if (res.ok) setDevEmailCode(data.devCode);
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyEmail(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to verify");
      await refresh();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmittingEmail(false);
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
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Verify your account
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        For trust and safety, you must verify your email before you can buy
        or sell tickets.
      </p>

      {user.emailVerified ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-700">
            You&apos;re verified. You can now buy and sell tickets.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to marketplace
          </button>
        </div>
      ) : (
        <section>
          <p className="mb-2 text-xs text-gray-400">
            Sent to {user.email}.{" "}
            {devEmailCode ? (
              <span className="text-gray-600">
                Demo mode — your code is{" "}
                <span className="font-mono font-semibold">{devEmailCode}</span>
                .
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 underline"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </p>
          <form onSubmit={handleVerifyEmail} className="flex gap-2">
            <input
              required
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="6-digit code"
              className="input"
            />
            <button
              type="submit"
              disabled={submittingEmail}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Verify
            </button>
          </form>
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </section>
      )}
    </div>
  );
}
