// Heuristic checks to stop sellers/buyers from sharing off-platform contact
// details (phone numbers, LINE/IG handles, links) inside free-text listing
// fields, which would let them transact around the platform's fee.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const HANDLE_RE = /(?<![\w@])@[a-zA-Z0-9_.]{2,30}\b/;
const KEYWORD_RE =
  /\b(line\s*id|line\s*:|line\s*@|ig\s*:|instagram|facebook|\bfb\s*:|whatsapp|wa\.me|telegram|t\.me|wechat|contact\s*me|add\s*me|dm\s*me|call\s*me|text\s*me|line\s*app)\b/i;

function containsLongDigitRun(text: string) {
  const candidates = text.match(/(?:\+?\d[\d\-.\s]{6,}\d)/g) ?? [];
  return candidates.some((c) => c.replace(/\D/g, "").length >= 9);
}

export function findContactInfo(text: string): string | null {
  if (!text) return null;
  if (EMAIL_RE.test(text)) return "an email address";
  if (URL_RE.test(text)) return "a link";
  if (containsLongDigitRun(text)) return "a phone number";
  if (KEYWORD_RE.test(text)) return "a social media or messaging reference";
  if (HANDLE_RE.test(text)) return "a social media handle";
  return null;
}

export function checkListingFieldsForContactInfo(
  fields: Record<string, string | undefined | null>
): string | null {
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    const found = findContactInfo(value);
    if (found) {
      return `The "${field}" field appears to contain ${found}. Remove any contact details — buyers and sellers must transact through the platform.`;
    }
  }
  return null;
}
