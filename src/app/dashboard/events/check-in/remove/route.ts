import { NextResponse } from "next/server";
import { requireEventVolunteerOrAdminRequest } from "@/lib/auth/route-helpers";
import { removeEventCheckinByTicket } from "@/lib/db/queries";

export async function POST(request: Request) {
  const access = await requireEventVolunteerOrAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as { eventId?: string; ticketId?: string };
  const eventId = String(body.eventId ?? "").trim();
  const ticketId = String(body.ticketId ?? "").trim();

  if (!eventId || !ticketId) {
    return NextResponse.json({ error: "Event and ticket are required." }, { status: 400 });
  }

  const data = await removeEventCheckinByTicket(eventId, ticketId);

  return NextResponse.json({ removed: Boolean(data) });
}
