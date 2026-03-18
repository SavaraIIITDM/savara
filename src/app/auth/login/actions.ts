"use server";

import { redirect } from "next/navigation";
import { createGoogleAuthorizationUrl } from "@/lib/auth/google";

export async function signInWithGoogle(nextPath?: string) {
  const authorizationUrl = await createGoogleAuthorizationUrl(nextPath);
  redirect(authorizationUrl);
}
