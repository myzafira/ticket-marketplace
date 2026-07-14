import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "TicketRight <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getClient();
  if (!resend) {
    // No API key configured — fall back to logging so local dev without
    // Resend set up still shows what would have been sent.
    console.log(`[email not sent — RESEND_API_KEY missing] To: ${to} | Subject: ${subject}`);
    return { sent: false as const };
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error(`[email failed] To: ${to} | Subject: ${subject} |`, error);
    return { sent: false as const };
  }
  return { sent: true as const };
}
