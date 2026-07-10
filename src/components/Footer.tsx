"use client";

import { useEffect, useState } from "react";

type Contact = {
  lineId: string | null;
  instagramId: string | null;
  phoneNumber: string | null;
};

export default function Footer() {
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetch("/api/settings/contact")
      .then((res) => res.json())
      .then(setContact)
      .catch(() => {});
  }, []);

  const hasContact =
    contact && (contact.lineId || contact.instagramId || contact.phoneNumber);

  if (!hasContact) return null;

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
        <p className="mb-2 font-medium text-gray-700">Contact TicketRight</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {contact.lineId && <span>LINE: {contact.lineId}</span>}
          {contact.instagramId && <span>Instagram: {contact.instagramId}</span>}
          {contact.phoneNumber && <span>Tel: {contact.phoneNumber}</span>}
        </div>
      </div>
    </footer>
  );
}
