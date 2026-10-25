import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "codeloom_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me-before-deploying");

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be set in production.");
}

export type Session = { userId: string; email: string; name: string };

export async function createSession(session: Session) {
  return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as Session;
  } catch { return null; }
}

export const sessionCookie = (value: string) => ({
  name: COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
});
