"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import ImageUploadField from "@/components/ImageUploadField";

export default function NewBuyRequestPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    eventName: "",
    venue: "",
    eventDate: "",
    quantity: "1",
    maxPrice: "",
    notes: "",
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const contactInfoError = checkListingFieldsForContactInfo({
      "event name": form.eventName,
      venue: form.venue,
      notes: form.notes,
    });
    if (contactInfoError) {
      setError(contactInfoError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/buy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: form.eventName,
          venue: form.venue || undefined,
          eventDate: new Date(form.eventDate).toISOString(),
          quantity: Number(form.quantity),
          maxPrice: Number(form.maxPrice),
          notes: form.notes || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post request");
      router.push(`/wanted/${data.buyRequest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-gray-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-gray-700">
          You need to{" "}
          <a href="/login" className="text-indigo-600 underline">
            log in
          </a>{" "}
          to post a ticket request.
        </p>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-gray-700">
          You need to{" "}
          <a href="/verify" className="text-indigo-600 underline">
            verify your email
          </a>{" "}
          before posting a ticket request.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Post a ticket request
      </h1>
      <p className="-mt-4 mb-6 text-sm text-gray-500">
        Let sellers know what you&apos;re looking for. Sellers respond by
        listing a matching ticket for sale — all purchases still go through
        the platform.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Event name">
          <input
            required
            value={form.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            placeholder="Taylor Swift — The Eras Tour"
            className="input"
          />
        </Field>

        <Field label="Venue (optional)">
          <input
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder="Madison Square Garden"
            className="input"
          />
        </Field>

        <Field label="Event date">
          <input
            required
            type="date"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <input
              required
              type="number"
              min={1}
              max={20}
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Max price per ticket (THB)">
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={form.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              placeholder="500.00"
              className="input"
            />
          </Field>
        </div>

        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Any section, seating, or accessibility preferences"
            className="input"
          />
        </Field>

        <ImageUploadField
          label="Reference image (optional)"
          imageUrl={imageUrl}
          onChange={setImageUrl}
        />
        <p className="-mt-2 text-xs text-gray-400">
          A seating chart, screenshot, or example of what you&apos;re looking
          for. Avoid images with contact details.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post request"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}
