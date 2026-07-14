"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

export default function Navbar() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  const needsVerification =
    !loading && user && (!user.emailVerified || !user.phoneVerified);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          TicketRight
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Browse
          </Link>
          <Link href="/wanted" className="text-gray-600 hover:text-gray-900">
            Browse requests
          </Link>
          {!loading && user && (
            <>
              <Link href="/sell" className="text-gray-600 hover:text-gray-900">
                Sell a ticket
              </Link>
              <Link
                href="/wanted/new"
                className="text-gray-600 hover:text-gray-900"
              >
                Post a request
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/messages"
                className="text-gray-600 hover:text-gray-900"
              >
                Messages
              </Link>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
              <span className="text-gray-400">|</span>
              <Link href="/account" className="text-gray-700 hover:underline">
                Hi, {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
      {needsVerification && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          Your account isn&apos;t verified yet.{" "}
          <Link href="/verify" className="font-medium underline">
            Verify your email and phone
          </Link>{" "}
          to buy or sell tickets.
        </div>
      )}
    </header>
  );
}
