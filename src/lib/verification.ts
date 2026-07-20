import { sendEmail } from "@/lib/email";

const CODE_TTL_MS = 15 * 60 * 1000;

// A 6-digit code has 1,000,000 combinations — cap guesses per issued code so
// it can't be brute-forced within its 15-minute lifetime.
export const MAX_CODE_ATTEMPTS = 5;

// Minimum time between issuing two codes to the same account, so a script
// can't just keep requesting fresh codes to reset the attempt counter.
const RESEND_COOLDOWN_MS = 60 * 1000;

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

// Codes don't store when they were sent separately — codeExpiry() always
// sets expiresAt to (sendTime + CODE_TTL_MS), so sendTime is recoverable by
// subtracting the TTL back out.
export function secondsUntilResendAllowed(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const lastSentAt = expiresAt.getTime() - CODE_TTL_MS;
  const cooldownEndsAt = lastSentAt + RESEND_COOLDOWN_MS;
  const remainingMs = cooldownEndsAt - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
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

export async function sendPasswordResetEmail(to: string, code: string) {
  return sendEmail({
    to,
    subject: "Reset your TicketRight password",
    html: `
      <p>Your password reset code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email — your password won't be changed.</p>
    `,
  });
}
