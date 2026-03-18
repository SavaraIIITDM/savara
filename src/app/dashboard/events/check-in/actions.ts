"use server";

import { revalidatePath } from "next/cache";
import { requireVolunteerOrAdmin } from "@/lib/auth/guards";
import {
  checkInIndividual,
  createTeamWithMembers,
  joinTeamWithMembers,
  removeEventCheckinByQr,
  removeEventCheckinByTicket,
} from "@/lib/db/queries";

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
  const role = await requireVolunteerOrAdmin();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const rawQr = String(formData.get("qrToken") ?? "");
  const qrToken = extractQrToken(rawQr);

  if (!eventId || !qrToken) {
    return { error: "Event and QR token are required." };
  }

  let data: string;
  try {
    data = await checkInIndividual({ eventId, qrToken, actorUserId: role.id });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to check in participant." };
  }

  revalidatePath("/dashboard/events/check-in");

  if (data === "already_registered") {
    return { success: "Participant already registered for this event." };
  }

  return { success: "Participant checked in successfully." };
}

export async function removeCheckInAction(formData: FormData) {
  await requireVolunteerOrAdmin();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const rawQr = String(formData.get("qrToken") ?? "");
  const qrToken = extractQrToken(rawQr);

  if (!eventId || !qrToken) {
    return { error: "Event and QR token are required." };
  }

  const data = await removeEventCheckinByQr(eventId, qrToken);

  revalidatePath("/dashboard/events/check-in");

  if (!data) {
    return { success: "No check-in found to remove." };
  }

  return { success: "Participant removed from this event." };
}

export async function removeCheckInByTicketAction(formData: FormData) {
  await requireVolunteerOrAdmin();

  const eventId = String(formData.get("eventId") ?? "").trim();
  const ticketId = String(formData.get("ticketId") ?? "").trim();

  if (!eventId || !ticketId) {
    return { error: "Event and ticket are required." };
  }

  const data = await removeEventCheckinByTicket(eventId, ticketId);

  revalidatePath("/dashboard/events/check-in");

  if (!data) {
    return { success: "No check-in found to remove." };
  }

  return { success: "Participant removed from this event." };
}

export async function createTeamAction(formData: FormData) {
  const role = await requireVolunteerOrAdmin();

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

  try {
    await createTeamWithMembers({
      eventId,
      teamName,
      leaderQr,
      memberQrs,
      actorUserId: role.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create team." };
  }

  revalidatePath("/dashboard/events/check-in");
  return { success: "Team created and checked in successfully." };
}

export async function joinTeamAction(formData: FormData) {
  const role = await requireVolunteerOrAdmin();

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

  let data: number;
  try {
    data = await joinTeamWithMembers({
      teamId,
      memberQrs,
      actorUserId: role.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to join team." };
  }

  revalidatePath("/dashboard/events/check-in");
  return { success: `${data ?? 0} member(s) added to team.` };
}
