import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/auth/route-helpers";
import {
  deleteTeamIfNoCheckins,
  listTeamMembersForManagement,
  listTeamsForManagement,
  removeTeamMemberForManagement,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as {
    action?: "list" | "members" | "removeMember" | "deleteTeam";
    eventId?: string;
    teamId?: string;
    ticketId?: string;
  };

  if (body.action === "list") {
    const eventId = String(body.eventId ?? "").trim();
    if (!eventId) {
      return NextResponse.json({ error: "Event id is required." }, { status: 400 });
    }
    const rows = await listTeamsForManagement(eventId);
    return NextResponse.json({ rows });
  }

  if (body.action === "members") {
    const eventId = String(body.eventId ?? "").trim();
    const teamId = String(body.teamId ?? "").trim();
    if (!eventId || !teamId) {
      return NextResponse.json({ error: "Event and team ids are required." }, { status: 400 });
    }
    const rows = await listTeamMembersForManagement(teamId, eventId);
    return NextResponse.json({ rows });
  }

  if (body.action === "removeMember") {
    const eventId = String(body.eventId ?? "").trim();
    const teamId = String(body.teamId ?? "").trim();
    const ticketId = String(body.ticketId ?? "").trim();
    if (!eventId || !teamId || !ticketId) {
      return NextResponse.json({ error: "Event, team and ticket ids are required." }, { status: 400 });
    }
    const removed = await removeTeamMemberForManagement({ eventId, teamId, ticketId });
    return NextResponse.json({ removed });
  }

  if (body.action === "deleteTeam") {
    const eventId = String(body.eventId ?? "").trim();
    const teamId = String(body.teamId ?? "").trim();
    if (!eventId || !teamId) {
      return NextResponse.json({ error: "Event and team ids are required." }, { status: 400 });
    }
    const result = await deleteTeamIfNoCheckins({ eventId, teamId });
    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
