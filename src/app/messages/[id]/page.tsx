"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import MessageThread from "@/components/MessageThread";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { translateApiError } from "@/lib/i18n/apiError";
import type { Message } from "@/lib/types";

type ConversationDetail = {
  id: string;
  listing: { id: string; eventName: string };
  otherParty: { handle: string };
};

export default function ConversationThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: loadingSession } = useSession();
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch(`/api/conversations/${id}/messages`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            translateApiError(t, data.error, t("conversationDetail.failedToLoad"))
          );
        setConversation(data.conversation);
        setMessages(data.messages ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function handleSendMessage(body: string) {
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        translateApiError(t, data.error, t("conversationDetail.failedToSend"))
      );
    setMessages((prev) => [...prev, data.message]);
  }

  if (loadingSession || loading) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-700">
          {t("common.needLoginPrefix")}{" "}
          <Link href="/login" className="text-indigo-600 underline">
            {t("common.logIn")}
          </Link>{" "}
          {t("common.needLoginSuffixGeneric")}
        </p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-8 text-gray-500">
        {error ?? t("conversationDetail.notFound")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/messages" className="text-sm text-indigo-600 underline">
        {t("conversationDetail.allMessages")}
      </Link>
      <div className="mt-3 rounded-lg border bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs text-gray-400">
          {t("conversationDetail.conversationWith", {
            handle: conversation.otherParty.handle,
          })}
        </p>
        <h1 className="mb-4 text-lg font-semibold text-gray-900">
          <Link
            href={`/listings/${conversation.listing.id}`}
            className="hover:underline"
          >
            {conversation.listing.eventName}
          </Link>
        </h1>
        <MessageThread messages={messages} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
