"use client";

import { useState, type FormEvent } from "react";
import type { Message } from "@/lib/types";

export default function MessageThread({
  messages,
  onSend,
  placeholder = "Type a message…",
}: {
  messages: Message[];
  onSend: (body: string) => Promise<void>;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {messages.length > 0 && (
        <div className="mb-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.fromMe
                    ? "bg-indigo-600 text-white"
                    : "border bg-white text-gray-900"
                }`}
              >
                <p>{m.body}</p>
                <p
                  className={`mt-1 text-xs ${
                    m.fromMe ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">
        Contact details (phone numbers, LINE, social handles, links) aren&apos;t
        allowed in messages — buy and sell only through the platform.
      </p>
    </div>
  );
}
