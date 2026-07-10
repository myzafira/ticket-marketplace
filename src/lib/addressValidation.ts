// Heuristic address format check. No geocoding/postal provider is wired up,
// so this cannot confirm the address actually exists — it only rejects
// obviously incomplete input (no house/street number, no postal code, too
// short). A real "true address" check would need a provider like Google
// Maps Geocoding API or Thailand Post's address API.

const THAI_POSTAL_CODE_RE = /\b\d{5}\b/;
const HOUSE_OR_STREET_NUMBER_RE = /\d/;

export function checkAddressLooksReal(address: string): string | null {
  const trimmed = address.trim();

  if (trimmed.length < 10) {
    return "Address looks too short — include street, city, and postal code";
  }
  if (!HOUSE_OR_STREET_NUMBER_RE.test(trimmed)) {
    return "Address should include a house/building or street number";
  }
  if (!THAI_POSTAL_CODE_RE.test(trimmed)) {
    return "Address should include a 5-digit postal code";
  }

  return null;
}
