import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/auth/route-helpers";
import { deleteCheckinAuditEntry, getCheckinAuditStats, listCheckinAudit } from "@/lib/db/queries";

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as {
    action?: "list" | "delete";
    eventId?: string;
    email?: string;
    checkinId?: number;
  };

  if (body.action === "list") {
    const eventId = String(body.eventId ?? "").trim();
    const email = String(body.email ?? "").trim();
    if (!eventId) {
      return NextResponse.json({ error: "Event id is required." }, { status: 400 });
    }
    const [rows, stats] = await Promise.all([
      listCheckinAudit({ eventId, email }),
      getCheckinAuditStats(eventId),
    ]);
    return NextResponse.json({ rows, stats });
  }

  if (body.action === "delete") {
    const checkinId = Number(body.checkinId ?? 0);
    if (!Number.isInteger(checkinId) || checkinId < 1) {
      return NextResponse.json({ error: "Valid check-in id is required." }, { status: 400 });
    }
    const removed = await deleteCheckinAuditEntry(checkinId);
    return NextResponse.json({ removed });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
