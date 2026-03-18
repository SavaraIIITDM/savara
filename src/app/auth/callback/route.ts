import { type NextRequest, NextResponse } from "next/server";
import { completeGoogleSignIn } from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(url);
  }

  try {
    const { userId, nextPath } = await completeGoogleSignIn(code, state);
    await createSession(userId, {
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    console.error("[auth/callback] OAuth callback failed:", reason);

    const url = new URL("/auth/login", request.url);
    url.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(url);
  }
}
