import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// The requester marks their own request fulfilled once they've bought a
// matching ticket through the normal listing/buy flow elsewhere on the site.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const buyRequest = await db.buyRequest.findUnique({ where: { id } });

  if (!buyRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (buyRequest.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (buyRequest.status !== "OPEN") {
    return NextResponse.json(
      { error: "This request is already closed" },
      { status: 409 }
    );
  }

  await db.buyRequest.update({
    where: { id },
    data: { status: "FULFILLED" },
  });

  return NextResponse.json({ ok: true });
}
