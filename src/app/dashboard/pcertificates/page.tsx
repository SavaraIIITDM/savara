import { requireDashboardUser } from "@/lib/auth/guards";
import { getMyParticipationCertificates, getProfileByUserId } from "@/lib/db/queries";
import { ParticipationCertificatesClient } from "@/components/dashboard/ParticipationCertificatesClient";

export default async function ParticipationCertificatesPage() {
  const user = await requireDashboardUser();

  const [profile, certificates] = await Promise.all([
    getProfileByUserId(user.id),
    getMyParticipationCertificates(user.id),
  ]);

  const displayName = (profile?.fullName || user.fullName || user.email || "Participant").trim();

  return (
    <ParticipationCertificatesClient
      initialName={displayName}
      hasChangedCertificateName={profile?.hasChangedCertificateName ?? false}
      certificates={(certificates ?? []).map((row) => ({
        checkinId: row.checkin_id,
        eventName: row.event_name,
        checkedInAt: row.checked_in_at,
      }))}
    />
  );
}
