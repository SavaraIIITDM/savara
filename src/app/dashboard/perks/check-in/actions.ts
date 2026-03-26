"use server";

import { revalidatePath } from "next/cache";
import { requirePerkVolunteerOrAdmin } from "@/lib/auth/guards";
import { checkInPerkIndividual, removePerkCheckin } from "@/lib/db/queries";

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

export async function checkInPerkIndividualAction(formData: FormData) {
  const role = await requirePerkVolunteerOrAdmin();

  const perkId = String(formData.get("perkId") ?? "").trim();
  const qrToken = extractQrToken(String(formData.get("qrToken") ?? ""));

  if (!perkId || !qrToken) {
    return { error: "Perk and QR token are required." };
  }

  let data: string;
  try {
    data = await checkInPerkIndividual({
      perkId,
      qrToken,
      actorUserId: role.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to check in perk." };
  }

  revalidatePath("/dashboard/perks/check-in");
  revalidatePath("/dashboard/ticket");

  if (data === "already_attended") {
    return { success: "Participant already attended this perk." };
  }

  return { success: "Participant checked in for perk." };
}

export async function removePerkCheckInAction(formData: FormData) {
  await requirePerkVolunteerOrAdmin();

  const perkId = String(formData.get("perkId") ?? "").trim();
  const qrToken = extractQrToken(String(formData.get("qrToken") ?? ""));

  if (!perkId || !qrToken) {
    return { error: "Perk and QR token are required." };
  }

  const data = await removePerkCheckin({ perkId, qrToken });

  revalidatePath("/dashboard/perks/check-in");
  revalidatePath("/dashboard/ticket");

  if (!data) {
    return { success: "No perk attendance found to remove." };
  }

  return { success: "Perk attendance removed." };
}
