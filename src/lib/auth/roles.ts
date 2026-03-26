import { getCurrentUser } from "@/lib/auth/session";
import { getProfileByUserId, getRoleRow } from "@/lib/db/queries";

export type DashboardRole = {
  id: string;
  email: string;
  isAdmin: boolean;
  isVolunteer: boolean;
  isEventVolunteer: boolean;
  isPerkVolunteer: boolean;
  participantType: "internal" | "external";
};

export async function getDashboardRole(): Promise<DashboardRole | null> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return null;
  }

  const normalizedEmail = user.email.toLowerCase();

  const [roleRow, profileRow] = await Promise.all([
    getRoleRow(normalizedEmail),
    getProfileByUserId(user.id),
  ]);

  const participantType =
    (profileRow?.participantType as "internal" | "external" | undefined) ??
    (normalizedEmail.endsWith("@iiitdm.ac.in") ? "internal" : "external");

  return {
    id: user.id,
    email: normalizedEmail,
    isAdmin: roleRow?.isAdmin ?? false,
    isVolunteer: roleRow?.isVolunteer ?? false,
    isEventVolunteer: roleRow?.isEventVolunteer ?? false,
    isPerkVolunteer: roleRow?.isPerkVolunteer ?? false,
    participantType,
  };
}
