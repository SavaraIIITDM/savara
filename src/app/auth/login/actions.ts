"use server";

import { redirect } from "next/navigation";
import { createGoogleAuthorizationUrl } from "@/lib/auth/google";
import { isDisabledRoute } from "@/lib/site-release";

export async function signInWithGoogle(nextPath?: string) {
  if (isDisabledRoute("/auth/login")) redirect("/");

  const authorizationUrl = await createGoogleAuthorizationUrl(nextPath);
  redirect(authorizationUrl);
}
