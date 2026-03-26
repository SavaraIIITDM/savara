"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { getRoleRow, grantVolunteer, revokeVolunteer } from "@/lib/db/queries";

export async function addVolunteerAction(formData: FormData) {
  const actor = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Valid email is required." };
  }

  const role = await getRoleRow(email);
  if (role?.isAdmin && email !== actor.email) {
    return { error: "Cannot modify another admin account." };
  }

  try {
    await grantVolunteer(email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to add volunteer." };
  }

  revalidatePath("/dashboard/admin/management/volunteers");
  revalidatePath("/dashboard/admin/management");
  return { success: `${email} is now a volunteer.` };
}

export async function removeVolunteerAction(formData: FormData) {
  const actor = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Volunteer email is required." };
  }

  const role = await getRoleRow(email);
  if (role?.isAdmin && email !== actor.email) {
    return { error: "Cannot modify another admin account." };
  }

  try {
    await revokeVolunteer(email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to remove volunteer." };
  }

  revalidatePath("/dashboard/admin/management/volunteers");
  revalidatePath("/dashboard/admin/management");
  return { success: `${email} volunteer access removed.` };
}
