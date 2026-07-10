import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { codeExpiry, generateVerificationCode } from "@/lib/verification";
import { checkAddressLooksReal } from "@/lib/addressValidation";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phoneNumber: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your address").max(300),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, phoneNumber, address } = parsed.data;

  const addressError = checkAddressLooksReal(address);
  if (addressError) {
    return NextResponse.json({ error: addressError }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyCode = generateVerificationCode();
  const phoneVerifyCode = generateVerificationCode();
  const expiresAt = codeExpiry();

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      phoneNumber,
      address,
      emailVerifyCode,
      emailVerifyExpiresAt: expiresAt,
      phoneVerifyCode,
      phoneVerifyExpiresAt: expiresAt,
    },
    select: { id: true, name: true, email: true },
  });

  await createSession(user.id);

  // Stubbed: no SMS/email provider is wired up, so the codes are returned
  // directly instead of actually being sent. See lib/verification.ts.
  return NextResponse.json(
    { user, devEmailCode: emailVerifyCode, devPhoneCode: phoneVerifyCode },
    { status: 201 }
  );
}
