"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  const needsVerification = !loading && user && !user.emailVerified;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          TicketRight
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            {t("nav.browse")}
          </Link>
          <Link href="/wanted" className="text-gray-600 hover:text-gray-900">
            {t("nav.browseRequests")}
          </Link>
          {!loading && user && (
            <>
              <Link href="/sell" className="text-gray-600 hover:text-gray-900">
                {t("nav.sell")}
              </Link>
              <Link
                href="/wanted/new"
                className="text-gray-600 hover:text-gray-900"
              >
                {t("nav.postRequest")}
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                {t("nav.dashboard")}
              </Link>
              <Link
                href="/messages"
                className="text-gray-600 hover:text-gray-900"
              >
                {t("nav.messages")}
              </Link>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  {t("nav.admin")}
                </Link>
              )}
              <span className="text-gray-400">|</span>
              <Link href="/account" className="text-gray-700 hover:underline">
                {t("nav.greeting", { name: user.name })}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                {t("nav.logout")}
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                {t("nav.login")}
              </Link>
              <Link
                href="/signup"
                className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
      {needsVerification && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          {t("nav.verifyBannerText")}{" "}
          <Link href="/verify" className="font-medium underline">
            {t("nav.verifyBannerLink")}
          </Link>{" "}
          {t("nav.verifyBannerSuffix")}
        </div>
      )}
    </header>
  );
}
