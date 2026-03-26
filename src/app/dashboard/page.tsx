import Link from "next/link";
import QRCode from "qrcode";
import { requireDashboardRole, requireDashboardUser } from "@/lib/auth/guards";
import { getMyParticipations, getMyPerkStatus, getProfileByUserId, getTicketByUserId } from "@/lib/db/queries";
import { getPendingActivationCodeForEmail } from "@/lib/tickets/pending-code";
import { DashboardTicketPanel } from "@/components/dashboard/DashboardTicketPanel";
import { CertificateNameCard } from "@/components/dashboard/CertificateNameCard";

export default async function DashboardHomePage() {
  const user = await requireDashboardUser();
  const role = await requireDashboardRole();
  const [participations, ticket, profile, perks] = await Promise.all([
    getMyParticipations(user.id),
    getTicketByUserId(user.id),
    getProfileByUserId(user.id),
    getMyPerkStatus(user.id),
  ]);

  const displayName = profile?.fullName || user.fullName || user.email || "Participant";
  const hasChangedCertificateName = profile?.hasChangedCertificateName ?? false;
  const pendingCode = user.email ? await getPendingActivationCodeForEmail(user.email) : null;
  const qrPayload = ticket ? JSON.stringify({ token: ticket.qrToken }) : null;
  const qrDataUrl = qrPayload ? await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 }) : null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardTicketPanel
        hasTicket={Boolean(ticket)}
        displayName={displayName}
        participantType={ticket?.participantType === "internal" ? "internal" : "external"}
        qrDataUrl={qrDataUrl}
        ticketSerial={ticket?.id.slice(0, 8).toUpperCase() ?? ""}
        perks={(perks ?? []).map((perk: { perk_id: string; perk_name: string; attended: boolean }) => ({
          perk_id: perk.perk_id,
          perk_name: perk.perk_name,
          attended: perk.attended,
        }))}
        pendingCode={pendingCode}
      />

      <CertificateNameCard fullName={displayName} hasChangedCertificateName={hasChangedCertificateName} />

      {(role.isVolunteer || role.isEventVolunteer || role.isAdmin) && (
        <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
          <h2 className="text-xl font-bold uppercase">Event Check-In</h2>
          <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            Select event, scan QR tokens, and manage teams.
          </p>
          <Link className="mt-4 inline-block rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.25)" }} href="/dashboard/events/check-in">
            Open Check-In
          </Link>
        </article>
      )}

      {(role.isVolunteer || role.isPerkVolunteer || role.isAdmin) && (
        <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
          <h2 className="text-xl font-bold uppercase">Perk Check-In</h2>
          <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            Check in internal participants for perks.
          </p>
          <Link className="mt-4 inline-block rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.25)" }} href="/dashboard/perks/check-in">
            Open Perk Check-In
          </Link>
        </article>
      )}

      {role.isAdmin && (
        <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
          <h2 className="text-xl font-bold uppercase">Admin Verification</h2>
          <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            Enter purchaser email and ticket count to generate activation code.
          </p>
          <Link className="mt-4 inline-block rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.25)" }} href="/dashboard/admin/purchases">
            Open Admin Panel
          </Link>
        </article>
      )}

      <article
        className="rounded-xl border p-5 sm:col-span-2 lg:col-span-3"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h2 className="text-2xl font-bold uppercase">Need Help?</h2>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
          Email us at fest@iiitdm.ac.in for any questions!
        </p>
      </article>

      <article
        className="rounded-xl border p-5 sm:col-span-2 lg:col-span-3"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h2 className="text-2xl font-bold uppercase">Participated Events</h2>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
          Your attendance records from volunteer check-ins.
        </p>

        {(participations ?? []).length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
            No event participation recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                  <th className="py-2">Event</th>
                  <th className="py-2">Check-In Time</th>
                  <th className="py-2">Team</th>
                </tr>
              </thead>
              <tbody>
                {(participations ?? []).map((row: { event_id: string; checked_in_at: string; event_name: string; team_name: string | null }) => (
                  <tr key={`${row.event_id}-${row.checked_in_at}`} className="border-t" style={{ borderColor: "rgba(212, 165, 116, 0.14)" }}>
                    <td className="py-2">{row.event_name}</td>
                    <td className="py-2">
                      {new Date(row.checked_in_at).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="py-2">{row.team_name ?? "Individual"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
