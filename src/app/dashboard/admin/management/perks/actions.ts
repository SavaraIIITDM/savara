"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createPerk, deletePerkIfNoCheckins, setPerkActive } from "@/lib/db/queries";

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "").toLowerCase() === "on" || String(value ?? "").toLowerCase() === "true";
}

export async function addPerkAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isActive = parseBoolean(formData.get("isActive"));

  if (!name) {
    return { error: "Perk name is required." };
  }

  let created:
    | {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
      }
    | undefined;

  try {
    created = await createPerk({ name, isActive });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create perk." };
  }

  if (!created) {
    return { error: "Unable to create perk." };
  }

  revalidatePath("/dashboard/admin/management/perks");
  revalidatePath("/dashboard/admin/management");
  revalidatePath("/dashboard/perks/check-in");
  return {
    success: "Perk created.",
    perk: {
      id: created.id,
      name: created.name,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

export async function togglePerkAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const isActive = parseBoolean(formData.get("isActive"));
  if (!id) {
    return { error: "Perk id is required." };
  }

  let updated = false;
  try {
    updated = await setPerkActive(id, isActive);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update perk." };
  }

  if (!updated) {
    return { error: "Perk not found." };
  }

  revalidatePath("/dashboard/admin/management/perks");
  revalidatePath("/dashboard/perks/check-in");
  return { success: "Perk updated." };
}

export async function deletePerkAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Perk id is required." };
  }

  try {
    const result = await deletePerkIfNoCheckins(id);
    if (result.notFound) {
      return { error: "Perk not found." };
    }
    if (!result.deleted) {
      return { error: `Cannot delete perk. ${result.checkins} redemption(s) exist.` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete perk." };
  }

  revalidatePath("/dashboard/admin/management/perks");
  revalidatePath("/dashboard/admin/management");
  revalidatePath("/dashboard/perks/check-in");
  return { success: "Perk deleted." };
}
