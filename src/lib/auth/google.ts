import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { OAUTH_NEXT_COOKIE_NAME, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/constants";
import { inferParticipantType, normalizeEmail } from "@/lib/auth/utils";
import { getDb } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function toAuthSchemaError(error: unknown) {
  const dbError = error as { code?: string; message?: string };
  if (dbError?.code === "42P01") {
    return new Error(
      "Auth tables are missing. Run your Drizzle migrations to create users/sessions/profiles before signing in.",
    );
  }

  if (dbError?.code === "42703") {
    return new Error(
      "Auth schema is outdated (missing required columns like users.google_sub). Run the latest Drizzle migrations.",
    );
  }

  if (dbError?.code === "23503") {
    return new Error(
      "Auth/profile foreign key mismatch. Ensure users row is created before profiles and run latest schema migrations.",
    );
  }

  return error instanceof Error ? error : new Error("Failed to complete Google sign-in");
}

function getBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const fallback = vercelUrl ? `https://${vercelUrl.replace(/^https?:\/\//, "")}` : undefined;
  const resolved = siteUrl || fallback;
  if (!resolved) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured and VERCEL_URL is unavailable");
  }
  return resolved;
}

function getRedirectUri() {
  return new URL("/auth/callback", getBaseUrl()).toString();
}

function generateState() {
  return randomBytes(24).toString("hex");
}

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured");
  }

  return { clientId, clientSecret };
}

export async function createGoogleAuthorizationUrl(nextPath?: string) {
  const { clientId } = getGoogleCredentials();
  const state = generateState();
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  if (nextPath && nextPath.startsWith("/")) {
    cookieStore.set(OAUTH_NEXT_COOKIE_NAME, nextPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  } else {
    cookieStore.delete(OAUTH_NEXT_COOKIE_NAME);
  }

  const authorizeUrl = new URL(GOOGLE_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getRedirectUri());
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("access_type", "offline");
  authorizeUrl.searchParams.set("prompt", "consent");

  return authorizeUrl.toString();
}

async function exchangeCodeForAccessToken(code: string) {
  const { clientId, clientSecret } = getGoogleCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Google OAuth code");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  const profile = (await response.json()) as GoogleUserInfo;
  if (!profile.sub || !profile.email) {
    throw new Error("Google profile is missing required fields");
  }

  return profile;
}

export async function completeGoogleSignIn(code: string, state: string) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!expectedState || expectedState !== state) {
    throw new Error("Invalid OAuth state. Start sign-in from /auth/login in the same browser session.");
  }

  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  const token = await exchangeCodeForAccessToken(code);
  const profile = await fetchGoogleUserInfo(token.access_token);
  const normalizedEmail = normalizeEmail(profile.email);

  const db = getDb();

  let matchedBySub: Array<{ id: string }> = [];
  try {
    matchedBySub = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.googleSub, profile.sub))
      .limit(1);
  } catch (error) {
    throw toAuthSchemaError(error);
  }

  let userId = matchedBySub[0]?.id;
  let shouldCreateProfile = false;

  if (!userId) {
    const matchedByEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    userId = matchedByEmail[0]?.id;
  }

  if (!userId) {
    const profileMatch = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail))
      .limit(1);
    userId = profileMatch[0]?.id;
  }

  if (!userId) {
    userId = crypto.randomUUID();
    shouldCreateProfile = true;
  }

  try {
    await db
      .insert(users)
      .values({
        id: userId,
        email: normalizedEmail,
        googleSub: profile.sub,
        fullName: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: normalizedEmail,
          googleSub: profile.sub,
          fullName: profile.name ?? null,
          avatarUrl: profile.picture ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    throw toAuthSchemaError(error);
  }

  if (shouldCreateProfile) {
    await db.insert(profiles).values({
      id: userId,
      email: normalizedEmail,
      fullName: profile.name ?? null,
      participantType: inferParticipantType(normalizedEmail),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db
    .update(profiles)
    .set({
      email: normalizedEmail,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  const nextPath = cookieStore.get(OAUTH_NEXT_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_NEXT_COOKIE_NAME);

  return {
    userId,
    nextPath: nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard",
  };
}
