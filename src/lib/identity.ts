// Platform-generated public identity shown in place of a user's real name
// whenever a buyer and seller can see each other. Prevents the two sides
// from identifying each other well enough to transact off-platform.
//
// If the user has set a nickname (see lib/nickname.ts for validation), it's
// shown with a short system-generated suffix for uniqueness — memorable,
// still anonymous. Otherwise falls back to the bare suffix code.

function shortCode(userId: string) {
  return userId.slice(-6).toUpperCase();
}

export function toPublicHandle(user: { id: string; nickname: string | null }) {
  const code = shortCode(user.id);
  if (user.nickname) {
    return `${user.nickname}-${code.slice(-2)}`;
  }
  return code;
}
