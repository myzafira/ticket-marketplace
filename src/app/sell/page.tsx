"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import ImageUploadField from "@/components/ImageUploadField";

type FeeTierInfo = { label: string; ratePercent: number };

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-xl px-4 py-8 text-gray-500">Loading…</p>
      }
    >
      <SellForm />
    </Suspense>
  );
}

function SellForm() {
  const { user, loading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feeTiers, setFeeTiers] = useState<FeeTierInfo[]>([]);
  const requestId = searchParams.get("requestId") ?? undefined;

  useEffect(() => {
    fetch("/api/settings/fees")
      .then((res) => res.json())
      .then((data) => setFeeTiers(data.tiers ?? []))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    title: "",
    eventName: searchParams.get("eventName") ?? "",
    venue: searchParams.get("venue") ?? "",
    eventDate: searchParams.get("eventDate") ?? "",
    section: "",
    quantity: searchParams.get("quantity") ?? "1",
    price: "",
    description: "",
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const contactInfoError = checkListingFieldsForContactInfo({
      "listing title": form.title,
      "event name": form.eventName,
      venue: form.venue,
      section: form.section,
      description: form.description,
    });
    if (contactInfoError) {
      setError(contactInfoError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          eventName: form.eventName,
          venue: form.venue,
          eventDate: new Date(form.eventDate).toISOString(),
          section: form.section || undefined,
          quantity: Number(form.quantity),
          price: Number(form.price),
          description: form.description || undefined,
          fulfillsRequestId: requestId,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create listing");
      router.push(`/listings/${data.listing.id}`);
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
          to list a ticket for sale.
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
          before listing a ticket for sale.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        List a ticket for sale
      </h1>
      {requestId && (
        <p className="mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Responding to a{" "}
          <a href={`/wanted/${requestId}`} className="underline">
            ticket request
          </a>
          . That request will automatically close once this listing sells.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <Field label="Listing title">
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="2x Floor Seats"
            className="input"
          />
        </Field>

        <Field label="Event name">
          <input
            required
            value={form.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            placeholder="Taylor Swift — The Eras Tour"
            className="input"
          />
        </Field>

        <Field label="Venue">
          <input
            required
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
          <Field label="Section (optional)">
            <input
              value={form.section}
              onChange={(e) => update("section", e.target.value)}
              placeholder="Floor A"
              className="input"
            />
          </Field>
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
        </div>

        <Field label="Price per ticket (THB)">
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="500.00"
            className="input"
          />
          {feeTiers.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Platform fee on sale:{" "}
              {feeTiers
                .map((t) => `${t.ratePercent}% (${t.label})`)
                .join(", ")}{" "}
              — deducted from your payout.
            </p>
          )}
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="input"
          />
        </Field>

        <ImageUploadField
          label="Ticket photo (optional)"
          imageUrl={imageUrl}
          onChange={setImageUrl}
        />
        <p className="-mt-2 text-xs text-gray-400">
          A photo of your actual ticket (e.g. the e-ticket screenshot) helps
          buyers trust the listing. Avoid photos with visible barcodes or
          personal contact details.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Publishing…" : "Publish listing"}
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
