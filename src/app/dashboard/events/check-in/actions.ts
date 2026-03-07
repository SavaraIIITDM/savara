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

export async function checkInIndividualAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const rawQr = String(formData.get("qrToken") ?? "");
  const qrToken = extractQrToken(rawQr);

  if (!eventId || !qrToken) {
    return { error: "Event and QR token are required." };
  }

  const { data, error } = await supabase.rpc("check_in_individual", {
    p_event_id: eventId,
    p_qr_token: qrToken,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/events/check-in");

  if (data === "already_registered") {
    return { success: "Participant already registered for this event." };
  }

  return { success: "Participant checked in successfully." };
}

export async function removeCheckInAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const rawQr = String(formData.get("qrToken") ?? "");
  const qrToken = extractQrToken(rawQr);

  if (!eventId || !qrToken) {
    return { error: "Event and QR token are required." };
  }

  const { data, error } = await supabase.rpc("remove_event_checkin", {
    p_event_id: eventId,
    p_qr_token: qrToken,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/events/check-in");

  if (!data) {
    return { success: "No check-in found to remove." };
  }

  return { success: "Participant removed from this event." };
}

export async function createTeamAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const teamName = String(formData.get("teamName") ?? "").trim();
  const leaderQr = extractQrToken(String(formData.get("leaderQr") ?? ""));
  const memberQrsJson = String(formData.get("memberQrsJson") ?? "[]");

  let memberQrs: string[] = [];
  try {
    const parsed = JSON.parse(memberQrsJson) as string[];
    memberQrs = parsed.map((token) => extractQrToken(String(token))).filter(Boolean);
  } catch {
    return { error: "Invalid member list." };
  }

  if (!eventId || !teamName || !leaderQr) {
    return { error: "Event, team name, and leader QR are required." };
  }

  if (memberQrs.length === 0) {
    return { error: "Scan at least one team member." };
  }

  const { error } = await supabase.rpc("create_team_with_members", {
    p_event_id: eventId,
    p_team_name: teamName,
    p_leader_qr: leaderQr,
    p_member_qrs: memberQrs,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/events/check-in");
  return { success: "Team created and checked in successfully." };
}

export async function joinTeamAction(formData: FormData) {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const teamId = String(formData.get("teamId") ?? "").trim();
  const memberQrsJson = String(formData.get("memberQrsJson") ?? "[]");

  let memberQrs: string[] = [];
  try {
    const parsed = JSON.parse(memberQrsJson) as string[];
    memberQrs = parsed.map((token) => extractQrToken(String(token))).filter(Boolean);
  } catch {
    return { error: "Invalid member list." };
  }

  if (!teamId || memberQrs.length === 0) {
    return { error: "Team and at least one member QR are required." };
  }

  const { error, data } = await supabase.rpc("join_team_with_members", {
    p_team_id: teamId,
    p_member_qrs: memberQrs,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/events/check-in");
  return { success: `${data ?? 0} member(s) added to team.` };
}
