import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ users: [] });
  }

  const users = await db.user.findMany({
    where: {
      OR: [{ email: { contains: q } }, { name: { contains: q } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      nickname: true,
      identityVerifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ users });
}
