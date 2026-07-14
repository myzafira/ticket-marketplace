import { findContactInfo } from "@/lib/moderation";

const NICKNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Format + moderation check for the self-chosen part of a user's public
// handle. Doesn't (and can't reliably) detect someone using their real
// name — that's on the user; the UI should warn against it.
export function checkNickname(nickname: string): string | null {
  if (!NICKNAME_RE.test(nickname)) {
    return "Nickname must be 3-20 characters: letters, numbers, and underscores only";
  }
  const contactInfo = findContactInfo(nickname);
  if (contactInfo) {
    return `Nickname appears to contain ${contactInfo} — pick something that isn't a way to contact you`;
  }
  return null;
}
