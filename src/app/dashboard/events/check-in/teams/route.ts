import { NextResponse } from "next/server";
import { requireEventVolunteerOrAdminRequest } from "@/lib/auth/route-helpers";
import { listTeamsByEvent } from "@/lib/db/queries";

export async function GET(request: Request) {
  const access = await requireEventVolunteerOrAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId")?.trim();

  if (!eventId) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  const data = await listTeamsByEvent(eventId);

  return NextResponse.json({ teams: data ?? [] });
}
