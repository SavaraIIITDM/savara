import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/auth/route-helpers";
import { deletePerkAuditEntry, getPerkRedemptionSummary, listPerkAudit } from "@/lib/db/queries";

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as {
    action?: "audit" | "deleteAudit";
    perkId?: string;
    email?: string;
    checkinId?: number;
  };

  if (body.action === "audit") {
    const perkId = String(body.perkId ?? "").trim();
    const email = String(body.email ?? "").trim();
    const [rows, summary] = await Promise.all([
      listPerkAudit({ perkId: perkId || undefined, email }),
      getPerkRedemptionSummary(),
    ]);
    return NextResponse.json({ rows, summary });
  }

  if (body.action === "deleteAudit") {
    const checkinId = Number(body.checkinId ?? 0);
    if (!Number.isInteger(checkinId) || checkinId < 1) {
      return NextResponse.json({ error: "Valid check-in id is required." }, { status: 400 });
    }
    const removed = await deletePerkAuditEntry(checkinId);
    return NextResponse.json({ removed });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
