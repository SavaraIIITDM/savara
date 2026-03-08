import QRCode from "qrcode";
import { requireDashboardRole, requireDashboardUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { TicketActivationForm } from "@/components/dashboard/TicketActivationForm";
import { TicketDrawerCard } from "@/components/dashboard/TicketDrawerCard";
import { getPendingActivationCodeForEmail } from "@/lib/tickets/pending-code";

export default async function DashboardTicketPage() {
  const user = await requireDashboardUser();
  await requireDashboardRole();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, qr_token, participant_type, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: perks } = await supabase.rpc("get_my_perk_status");

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email || "Participant";
  const pendingCode = user.email ? await getPendingActivationCodeForEmail(user.email) : null;

  const qrPayload = ticket
    ? JSON.stringify({
        token: ticket.qr_token,
      })
    : null;

  const qrDataUrl = qrPayload ? await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 }) : null;

  if (!ticket) {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        <article
          className="rounded-xl border p-5"
          style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
        >
          <h1 className="text-2xl font-bold uppercase">Ticket Activation</h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(245, 230, 211, 0.82)" }}>
            Redeem your activation code to create your personal fest ticket.
          </p>
          {pendingCode && (
            <div
              className="mt-3 rounded-md border px-3 py-3"
              style={{ borderColor: "rgba(212, 165, 116, 0.3)", background: "rgba(10, 4, 8, 0.25)" }}
            >
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(245, 230, 211, 0.6)" }}>
                Assigned Activation Code
              </p>
              <p className="mt-1 text-xl font-bold tracking-[0.08em]">{pendingCode.code}</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                {pendingCode.redeemedCount}/{pendingCode.ticketQuota} redeemed · {pendingCode.remaining} remaining
              </p>
            </div>
          )}
          <TicketActivationForm />
        </article>
      </section>
    );
  }

  return (
    <section>
      {qrDataUrl && (
        <TicketDrawerCard
          displayName={displayName}
          participantType={ticket.participant_type === "internal" ? "internal" : "external"}
          qrDataUrl={qrDataUrl}
          perks={(perks ?? []).map((perk) => ({
            perk_id: perk.perk_id,
            perk_name: perk.perk_name,
            attended: perk.attended,
          }))}
        />
      )}
    </section>
  );
}
