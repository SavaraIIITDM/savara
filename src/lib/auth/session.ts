import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/auth/constants";
import type { AuthUser } from "@/lib/auth/types";
import { randomToken } from "@/lib/auth/utils";
import { getDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function getCookieConfig(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(userId: string, metadata?: { ipAddress?: string; userAgent?: string }) {
  const db = getDb();
  const sessionId = randomToken(48);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    ipAddress: metadata?.ipAddress ?? null,
    userAgent: metadata?.userAgent ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, getCookieConfig(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return;
  }

  const db = getDb();
  await db.delete(sessions).where(eq(sessions.id, sessionId));
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const now = new Date();

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    try {
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // Cookie mutations are not allowed in all server contexts.
    }
    return null;
  }

  const refreshedExpiry = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .update(sessions)
    .set({
      expiresAt: refreshedExpiry,
      lastSeenAt: now,
    })
    .where(eq(sessions.id, sessionId));

  try {
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, getCookieConfig(refreshedExpiry));
  } catch {
    // Cookie mutations are not allowed in all server contexts.
  }

  return {
    id: row.userId,
    email: row.email,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
  };
}
