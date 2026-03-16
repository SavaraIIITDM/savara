import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, qr_token, participant_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket) {
    return new Response("Ticket not found", { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email || "Participant";
  const ticketTypeLabel =
    ticket.participant_type === "internal" ? "INTERNAL" : "EXTERNAL";
  const ticketSerial = ticket.id.slice(0, 8).toUpperCase();

  const qrPayload = JSON.stringify({ token: ticket.qr_token });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 420 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg,#f2a043 0%,#ea8b2a 44%,#df7a1c 100%)",
          color: "#2f180a",
          padding: "32px",
          border: "1px solid rgba(47,24,10,0.2)",
          fontFamily: "Rajdhani, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              color: "rgba(47,24,10,0.8)",
            }}
          >
            Savara 2026 Pass
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 34,
              fontWeight: 700,
              textTransform: "uppercase",
              lineHeight: 1.08,
              maxWidth: "100%",
            }}
          >
            {displayName}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignSelf: "flex-start",
              borderRadius: 999,
              border: "1px solid rgba(47,24,10,0.26)",
              background: "rgba(255,255,255,0.32)",
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            {ticketTypeLabel}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 16,
            border: "1px solid rgba(47,24,10,0.18)",
            background: "rgba(255,255,255,0.92)",
            padding: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img src={qrDataUrl} alt="Ticket QR export" width={420} height={420} />
        </div>

        <div
          style={{
            marginTop: 20,
            borderRadius: 8,
            border: "1px solid rgba(47,24,10,0.18)",
            background: "rgba(255,255,255,0.44)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "rgba(47,24,10,0.72)",
            }}
          >
            Ticket Serial
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            {ticketSerial}
          </div>
        </div>
      </div>
    ),
    {
      width: 520,
      height: 760,
      headers: {
        "Content-Disposition": `attachment; filename=\"SAVARA_PASS_${ticketSerial}.png\"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
