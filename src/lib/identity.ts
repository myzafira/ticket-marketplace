// Platform-generated public identity shown in place of a user's real name
// whenever a buyer and seller can see each other. Prevents the two sides
// from identifying each other well enough to transact off-platform.
export function toPublicHandle(userId: string) {
  return userId.slice(-6).toUpperCase();
}
