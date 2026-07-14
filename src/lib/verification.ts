import { sendEmail } from "@/lib/email";

const CODE_TTL_MS = 15 * 60 * 1000;

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function codeExpiry() {
  return new Date(Date.now() + CODE_TTL_MS);
}

export function isCodeValid(
  storedCode: string | null,
  expiresAt: Date | null,
  submittedCode: string
) {
  if (!storedCode || !expiresAt) return false;
  if (expiresAt.getTime() < Date.now()) return false;
  return storedCode === submittedCode.trim();
}

export async function sendVerificationEmail(to: string, code: string) {
  return sendEmail({
    to,
    subject: "Verify your TicketRight account",
    html: `
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
