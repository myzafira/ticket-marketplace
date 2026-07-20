import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { getAdminEmails } from "@/lib/settings";
import { sendEmail, escapeHtml } from "@/lib/email";
import { isUniqueConstraintError } from "@/lib/prismaErrors";

const reportSchema = z.object({
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

  const listing = await db.listing.findUnique({
    where: { id },
    include: { seller: { select: { name: true, email: true } } },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot report your own listing" },
      { status: 400 }
    );
  }

  const existing = await db.listingReport.findUnique({
    where: {
      listingId_reporterId_status: { listingId: id, reporterId: user.id, status: "OPEN" },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an open report for this listing" },
      { status: 409 }
    );
  }

  const { message } = parsed.data;
  let report;
  try {
    report = await db.listingReport.create({
      data: { listingId: id, reporterId: user.id, message },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json(
        { error: "You already have an open report for this listing" },
        { status: 409 }
      );
    }
    throw err;
  }

  const adminEmails = await getAdminEmails();
  const html = `<p><strong>${escapeHtml(user.name)}</strong> flagged listing "${escapeHtml(listing.title)}" (${escapeHtml(listing.eventName)}) as unfairly priced.</p>
<p>Message: ${escapeHtml(message)}</p>
<p>Seller: ${escapeHtml(listing.seller.name)} (${escapeHtml(listing.seller.email)})</p>`;

  await Promise.all(
    adminEmails.map((to) =>
      sendEmail({ to, subject: `Listing flagged — ${listing.eventName}`, html })
    )
  );

  return NextResponse.json(
    { report: { id: report.id, status: report.status, createdAt: report.createdAt } },
    { status: 201 }
  );
}
