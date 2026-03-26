import { NextResponse } from "next/server";
import { requireEventVolunteerOrAdminRequest } from "@/lib/auth/route-helpers";
import { resolveParticipantByQr } from "@/lib/db/queries";

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
  const access = await requireEventVolunteerOrAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as { eventId?: string; qrValue?: string };
  const eventId = String(body.eventId ?? "").trim();
  const qrToken = extractQrToken(String(body.qrValue ?? ""));

  if (!eventId || !qrToken) {
    return NextResponse.json({ error: "Event and QR are required." }, { status: 400 });
  }

  const resolved = await resolveParticipantByQr({ eventId, qrToken });
  if (!resolved) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  return NextResponse.json({ participant: resolved });
}
