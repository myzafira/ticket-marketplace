import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const buyRequest = await db.buyRequest.findUnique({
    where: { id },
    include: { buyer: { select: { id: true } } },
  });

  if (!buyRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({
    buyRequest: {
      ...buyRequest,
      buyer: { handle: toPublicHandle(buyRequest.buyer.id) },
    },
  });
}

export async function DELETE(
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
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
