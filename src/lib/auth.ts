import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { getPermissionsForRole, isAdminRole } from "@/lib/permissions";

const SESSION_COOKIE = "session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me-in-production"
);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phoneNumber: true,
        address: true,
        emailVerified: true,
        createdAt: true,
        listingRestrictedAt: true,
        pointsBalance: true,
        role: true,
      },
    });
    if (!user) return null;

    const isAdmin = isAdminRole(user.role);
    const isFullAdmin = user.role === "FULL_ADMIN";
    const permissions = await getPermissionsForRole(user.role);
    return { ...user, isAdmin, isFullAdmin, permissions };
  } catch {
    return null;
  }
}

export function isFullyVerified(user: { emailVerified: boolean }) {
  return user.emailVerified;
}
