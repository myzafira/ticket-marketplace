import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { getAdminEmails } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

const REASON_LABELS: Record<string, string> = {
  TICKET_NOT_RECEIVED: "Ticket not received",
  WRONG_OR_INVALID_TICKET: "Wrong or invalid ticket",
  PAYMENT_ISSUE: "Payment issue",
  OTHER: "Other",
};

const reportSchema = z.object({
  reason: z.enum([
    "TICKET_NOT_RECEIVED",
    "WRONG_OR_INVALID_TICKET",
    "PAYMENT_ISSUE",
    "OTHER",
  ]),
  message: z.string().min(1).max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Verify your email before filing a report" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      listing: { select: { eventName: true, sellerId: true, seller: { select: { name: true, email: true } } } },
      buyer: { select: { name: true, email: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.buyerId !== user.id && order.listing.sellerId !== user.id) {
    return NextResponse.json(
      { error: "You weren't part of this order" },
      { status: 403 }
    );
  }

  const existing = await db.orderReport.findUnique({
    where: {
      orderId_reporterId_status: { orderId: id, reporterId: user.id, status: "OPEN" },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an open report for this order" },
      { status: 409 }
    );
  }

  const { reason, message } = parsed.data;
  const report = await db.orderReport.create({
    data: { orderId: id, reporterId: user.id, reason, message },
  });

  const adminEmails = await getAdminEmails();
  const role = order.buyerId === user.id ? "buyer" : "seller";
  const html = `<p><strong>${user.name}</strong> (${role}) reported order ${order.id} for "${order.listing.eventName}".</p>
<p>Reason: ${REASON_LABELS[reason]}</p>
<p>Message: ${message}</p>
<p>Buyer: ${order.buyer.name} (${order.buyer.email})<br/>
Seller: ${order.listing.seller.name} (${order.listing.seller.email})</p>`;

  await Promise.all(
    adminEmails.map((to) =>
      sendEmail({ to, subject: `Order report — ${order.listing.eventName}`, html })
    )
  );

  return NextResponse.json(
    { report: { id: report.id, status: report.status, createdAt: report.createdAt } },
    { status: 201 }
  );
}
