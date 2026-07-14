import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { checkNickname } from "@/lib/nickname";

const nicknameSchema = z.object({
  nickname: z.string().max(20).nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = nicknameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const nickname = parsed.data.nickname?.trim() || null;
  if (nickname) {
    const nicknameError = checkNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { nickname },
    select: { id: true, nickname: true },
  });

  return NextResponse.json({
    nickname: updated.nickname,
    handle: toPublicHandle(updated),
  });
}
