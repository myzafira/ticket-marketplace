import { db } from "@/lib/db";
import { getPlatformSettings, parseAdminEmails } from "@/lib/settings";

type MatchParticipant = {
  name: string;
  email: string;
  phoneNumber: string;
};

type MatchDetails = {
  eventName: string;
  eventDate: Date;
  buyer: MatchParticipant;
  seller: MatchParticipant;
  buyRequestId: string;
  listingId: string;
};

// Stubbed: no email provider is wired up yet, so this logs what would be
// sent and stores the alert for the admin dashboard instead of actually
// emailing anyone. Swap in a real provider (e.g. Resend, SendGrid) here.
export async function notifyAdminOfMatch(details: MatchDetails) {
  const settings = await getPlatformSettings();
  const adminEmails = parseAdminEmails(settings.adminEmails);

  const message = `${details.buyer.name} wants to buy "${details.eventName}" and ${details.seller.name} just listed a matching ticket. Call the buyer at ${details.buyer.phoneNumber} or the seller at ${details.seller.phoneNumber} to help arrange it.`;

  console.log(
    `[stub email] To: ${adminEmails.join(", ") || "(no admin configured)"} | Subject: New buy/sell match on TicketRight | Body: ${message}`
  );

  await db.adminNotification.create({
    data: {
      message,
      eventName: details.eventName,
      eventDate: details.eventDate,
      buyerName: details.buyer.name,
      buyerPhone: details.buyer.phoneNumber,
      buyerEmail: details.buyer.email,
      sellerName: details.seller.name,
      sellerPhone: details.seller.phoneNumber,
      sellerEmail: details.seller.email,
      buyRequestId: details.buyRequestId,
      listingId: details.listingId,
    },
  });
}

// Stubbed: notifies the buyer and seller themselves that a match happened.
// Deliberately does NOT include the other party's contact details — buyers
// and sellers stay anonymous to each other; only the platform (admin) sees
// real contact info, via notifyAdminOfMatch above.
export async function notifyPartiesOfMatch(details: MatchDetails) {
  console.log(
    `[stub email] To: ${details.buyer.email} | Subject: A ticket matching your request is available | Body: Good news — a seller listed a ticket for "${details.eventName}" that matches your request. Log in to TicketRight and check your dashboard to buy it.`
  );
  console.log(
    `[stub email] To: ${details.seller.email} | Subject: Your listing matches a buyer's request | Body: Your listing for "${details.eventName}" matches an open ticket request. It's already linked — no action needed. It'll close automatically once the buyer purchases it.`
  );
}
