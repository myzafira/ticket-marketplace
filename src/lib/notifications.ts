import { db } from "@/lib/db";
import { getAdminEmails } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

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

export async function notifyAdminOfMatch(details: MatchDetails) {
  const adminEmails = await getAdminEmails();

  const message = `${details.buyer.name} wants to buy "${details.eventName}" and ${details.seller.name} just listed a matching ticket. Call the buyer at ${details.buyer.phoneNumber} or the seller at ${details.seller.phoneNumber} to help arrange it.`;

  await Promise.all(
    adminEmails.map((to) =>
      sendEmail({
        to,
        subject: "New buy/sell match on TicketRight",
        html: `<p>${message}</p>`,
      })
    )
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

// Notifies the buyer and seller themselves that a match happened.
// Deliberately does NOT include the other party's contact details — buyers
// and sellers stay anonymous to each other; only the platform (admin) sees
// real contact info, via notifyAdminOfMatch above.
export async function notifyPartiesOfMatch(details: MatchDetails) {
  await Promise.all([
    sendEmail({
      to: details.buyer.email,
      subject: "A ticket matching your request is available",
      html: `<p>Good news — a seller listed a ticket for "${details.eventName}" that matches your request. Log in to TicketRight and check your dashboard to buy it.</p>`,
    }),
    sendEmail({
      to: details.seller.email,
      subject: "Your listing matches a buyer's request",
      html: `<p>Your listing for "${details.eventName}" matches an open ticket request. It's already linked — no action needed. It'll close automatically once the buyer purchases it.</p>`,
    }),
  ]);
}
