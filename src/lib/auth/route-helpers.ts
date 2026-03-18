import { NextResponse } from "next/server";
import { getRequestUser, requireVolunteerOrAdminForRequest } from "@/lib/auth/server-guards";
import { getRoleRow } from "@/lib/db/queries";

export async function requireAuthenticatedRequest(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { user };
}

export async function requireVolunteerOrAdminRequest(request: Request) {
  const access = await requireVolunteerOrAdminForRequest(request);
  if (access.error) {
    return {
      error: NextResponse.json({ error: access.error }, { status: access.status }),
    };
  }
  return { user: access.user };
}

export async function requireAdminRequest(request: Request) {
  const access = await requireVolunteerOrAdminForRequest(request);
  if (access.error || !access.user) {
    return {
      error: NextResponse.json({ error: access.error ?? "Authentication required." }, { status: access.status }),
    };
  }

  const role = await getRoleRow(access.user.email);
  if (!role?.isAdmin) {
    return {
      error: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    };
  }

  return { user: access.user };
}
