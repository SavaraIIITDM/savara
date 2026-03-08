"use server";

import { revalidatePath } from "next/cache";
import { requireVolunteerOrAdmin } from "@/lib/auth/guards";
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

export async function checkInPerkIndividualAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const perkId = String(formData.get("perkId") ?? "").trim();
  const qrToken = extractQrToken(String(formData.get("qrToken") ?? ""));

  if (!perkId || !qrToken) {
    return { error: "Perk and QR token are required." };
  }

  const { data, error } = await supabase.rpc("check_in_perk_individual", {
    p_perk_id: perkId,
    p_qr_token: qrToken,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perks/check-in");
  revalidatePath("/dashboard/ticket");

  if (data === "already_attended") {
    return { success: "Participant already attended this perk." };
  }

  return { success: "Participant checked in for perk." };
}

export async function removePerkCheckInAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const perkId = String(formData.get("perkId") ?? "").trim();
  const qrToken = extractQrToken(String(formData.get("qrToken") ?? ""));

  if (!perkId || !qrToken) {
    return { error: "Perk and QR token are required." };
  }

  const { data, error } = await supabase.rpc("remove_perk_checkin", {
    p_perk_id: perkId,
    p_qr_token: qrToken,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perks/check-in");
  revalidatePath("/dashboard/ticket");

  if (!data) {
    return { success: "No perk attendance found to remove." };
  }

  return { success: "Perk attendance removed." };
}
