import QRCode from "qrcode";
import { requireDashboardRole, requireDashboardUser } from "@/lib/auth/guards";
import { getMyPerkStatus, getProfileByUserId, getTicketByUserId } from "@/lib/db/queries";
import { TicketActivationForm } from "@/components/dashboard/TicketActivationForm";
import { TicketDrawerCard } from "@/components/dashboard/TicketDrawerCard";
import { getPendingActivationCodeForEmail } from "@/lib/tickets/pending-code";

export default async function DashboardTicketPage() {
  const user = await requireDashboardUser();
  await requireDashboardRole();
  const [ticket, profile, perks] = await Promise.all([
    getTicketByUserId(user.id),
    getProfileByUserId(user.id),
    getMyPerkStatus(user.id),
  ]);

  const displayName = profile?.fullName || user.fullName || user.email || "Participant";
  const pendingCode = user.email ? await getPendingActivationCodeForEmail(user.email) : null;

  const qrPayload = ticket
    ? JSON.stringify({
        token: ticket.qrToken,
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
            Redeem your activation code to get your fest ticket.
          </p>
          {pendingCode && (
            <div
              className="mt-3 rounded-md border px-3 py-3"
              style={{ borderColor: "rgba(212, 165, 116, 0.3)", background: "rgba(10, 4, 8, 0.25)" }}
            >
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(245, 230, 211, 0.6)" }}>
                Your Activation Code
              </p>
              <p className="mt-1 text-xl font-bold tracking-[0.08em]">{pendingCode.code}</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                {pendingCode.redeemedCount}/{pendingCode.ticketQuota} redeemed · {pendingCode.remaining} remaining
                <br />
                You can share this code with your friends to redeem.
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
          visible
          onRequestHide={undefined}
          displayName={displayName}
          participantType={ticket.participantType === "internal" ? "internal" : "external"}
          qrDataUrl={qrDataUrl}
          ticketSerial={ticket.id.slice(0, 8).toUpperCase()}
          perks={(perks ?? []).map((perk: { perk_id: string; perk_name: string; attended: boolean }) => ({
            perk_id: perk.perk_id,
            perk_name: perk.perk_name,
            attended: perk.attended,
          }))}
        />
      )}
    </section>
  );
}
