import type { NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getDb } from "@/lib/db/client";
import { roles, sessions, users } from "@/lib/db/schema";

export type RouteUser = {
  id: string;
  email: string;
};

export async function getRequestUser(request: NextRequest | Request): Promise<RouteUser | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  const sessionId = match?.split("=")[1];
  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export async function requireVolunteerOrAdminForRequest(request: NextRequest | Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { user: null, status: 401 as const, error: "Authentication required." };
  }

  const db = getDb();
  const roleRows = await db
    .select({
      isAdmin: roles.isAdmin,
      isVolunteer: roles.isVolunteer,
      isEventVolunteer: roles.isEventVolunteer,
      isPerkVolunteer: roles.isPerkVolunteer,
    })
    .from(roles)
    .where(eq(roles.email, user.email.toLowerCase()))
    .limit(1);

  const role = roleRows[0];
  if (!role?.isAdmin && !role?.isVolunteer && !role?.isEventVolunteer && !role?.isPerkVolunteer) {
    return { user: null, status: 403 as const, error: "Volunteer or admin access required." };
  }

  return { user, status: 200 as const, error: null };
}

export async function requireEventVolunteerOrAdminForRequest(request: NextRequest | Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { user: null, status: 401 as const, error: "Authentication required." };
  }

  const db = getDb();
  const roleRows = await db
    .select({
      isAdmin: roles.isAdmin,
      isVolunteer: roles.isVolunteer,
      isEventVolunteer: roles.isEventVolunteer,
    })
    .from(roles)
    .where(eq(roles.email, user.email.toLowerCase()))
    .limit(1);

  const role = roleRows[0];
  if (!role?.isAdmin && !role?.isVolunteer && !role?.isEventVolunteer) {
    return { user: null, status: 403 as const, error: "Event volunteer or admin access required." };
  }

  return { user, status: 200 as const, error: null };
}

export async function requirePerkVolunteerOrAdminForRequest(request: NextRequest | Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { user: null, status: 401 as const, error: "Authentication required." };
  }

  const db = getDb();
  const roleRows = await db
    .select({
      isAdmin: roles.isAdmin,
      isVolunteer: roles.isVolunteer,
      isPerkVolunteer: roles.isPerkVolunteer,
    })
    .from(roles)
    .where(eq(roles.email, user.email.toLowerCase()))
    .limit(1);

  const role = roleRows[0];
  if (!role?.isAdmin && !role?.isVolunteer && !role?.isPerkVolunteer) {
    return { user: null, status: 403 as const, error: "Perk volunteer or admin access required." };
  }

  return { user, status: 200 as const, error: null };
}
