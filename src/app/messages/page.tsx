"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import type { ConversationSummary } from "@/lib/types";

export default function MessagesInboxPage() {
  const { user, loading: loadingSession } = useSession();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/me/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  if (loadingSession || loading) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-700">
          You need to{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to view your messages.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-gray-500">
          No conversations yet. Ask a seller a question from any listing page.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {c.listing.eventName}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {c.role === "seller" ? "Buyer" : "Seller"} #{c.otherParty.handle}
              </p>
              {c.lastMessage && (
                <p className="mt-1 truncate text-sm text-gray-600">
                  {c.lastMessage}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
