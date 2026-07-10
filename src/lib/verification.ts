// Stubbed verification: no SMS/email provider is wired up yet, so codes are
// generated and returned directly to the client instead of being sent.
// Swap in a real provider (e.g. Twilio for SMS, Resend for email) by having
// `sendCode` below actually dispatch instead of returning the code.

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
