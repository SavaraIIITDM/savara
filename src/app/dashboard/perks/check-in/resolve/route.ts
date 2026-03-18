import { NextResponse } from "next/server";
import { requireVolunteerOrAdminRequest } from "@/lib/auth/route-helpers";
import { resolveInternalParticipantByQrForPerk } from "@/lib/db/queries";

function extractQrToken(rawValue: string) {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as { token?: string };
      return String(parsed.token ?? "").trim();
    } catch {
      return value;
    }
  }

  return value;
}

export async function POST(request: Request) {
  const access = await requireVolunteerOrAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as { perkId?: string; qrValue?: string };
  const perkId = String(body.perkId ?? "").trim();
  const qrToken = extractQrToken(String(body.qrValue ?? ""));

  if (!perkId || !qrToken) {
    return NextResponse.json({ error: "Perk and QR are required." }, { status: 400 });
  }

  const participant = await resolveInternalParticipantByQrForPerk({ perkId, qrToken });
  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  return NextResponse.json({ participant });
}
