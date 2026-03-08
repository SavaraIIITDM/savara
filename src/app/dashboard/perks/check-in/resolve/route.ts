import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as { perkId?: string; qrValue?: string };
  const perkId = String(body.perkId ?? "").trim();
  const qrToken = extractQrToken(String(body.qrValue ?? ""));

  if (!perkId || !qrToken) {
    return NextResponse.json({ error: "Perk and QR are required." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("resolve_internal_participant_by_qr_for_perk", {
    p_perk_id: perkId,
    p_qr_token: qrToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const participant = data?.[0];
  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  return NextResponse.json({ participant });
}
