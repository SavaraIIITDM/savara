import { type NextRequest, NextResponse } from "next/server";
import { completeGoogleSignIn } from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";

function getRedirectBaseUrl(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl;
  }

  return request.url;
}

export async function GET(request: NextRequest) {
  const redirectBaseUrl = getRedirectBaseUrl(request);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    const url = new URL("/auth/login", redirectBaseUrl);
    url.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(url);
  }

  try {
    const { userId, nextPath } = await completeGoogleSignIn(code, state);
    await createSession(userId, {
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.redirect(new URL(nextPath, redirectBaseUrl));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    console.error("[auth/callback] OAuth callback failed:", reason);

    const url = new URL("/auth/login", redirectBaseUrl);
    url.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(url);
  }
}
