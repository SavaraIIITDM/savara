"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createEvent, deleteEventIfNoCheckins, updateEvent } from "@/lib/db/queries";
import { slugify } from "@/lib/slugify";

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "").toLowerCase() === "on" || String(value ?? "").toLowerCase() === "true";
}

function parseInteger(raw: FormDataEntryValue | null) {
  const parsed = Number(String(raw ?? "").trim());
  return Number.isInteger(parsed) ? parsed : NaN;
}

export async function addEventAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const teamMinSize = parseInteger(formData.get("teamMinSize"));
  const teamMaxSize = parseInteger(formData.get("teamMaxSize"));
  const isActive = parseBoolean(formData.get("isActive"));

  if (!name) {
    return { error: "Name is required." };
  }

  if (!Number.isInteger(teamMinSize) || !Number.isInteger(teamMaxSize) || teamMinSize < 1 || teamMaxSize < teamMinSize) {
    return { error: "Team size range is invalid." };
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    return { error: "Slug is invalid." };
  }

  let created:
    | {
        id: string;
        name: string;
        slug: string;
        teamMinSize: number;
        teamMaxSize: number;
        isActive: boolean;
        createdAt: Date;
      }
    | undefined;

  try {
    created = await createEvent({ name, slug, teamMinSize, teamMaxSize, isActive });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create event." };
  }

  if (!created) {
    return { error: "Unable to create event." };
  }

  revalidatePath("/dashboard/admin/management/events");
  revalidatePath("/dashboard/admin/management");
  revalidatePath("/dashboard/events/check-in");
  return {
    success: "Event created.",
    event: {
      id: created.id,
      name: created.name,
      slug: created.slug,
      teamMinSize: created.teamMinSize,
      teamMaxSize: created.teamMaxSize,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

export async function editEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const teamMinSize = parseInteger(formData.get("teamMinSize"));
  const teamMaxSize = parseInteger(formData.get("teamMaxSize"));
  const isActive = parseBoolean(formData.get("isActive"));

  if (!id || !name) {
    return { error: "Event id and name are required." };
  }

  if (!Number.isInteger(teamMinSize) || !Number.isInteger(teamMaxSize) || teamMinSize < 1 || teamMaxSize < teamMinSize) {
    return { error: "Team size range is invalid." };
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    return { error: "Slug is invalid." };
  }

  let updated = false;
  try {
    updated = await updateEvent({ id, name, slug, teamMinSize, teamMaxSize, isActive });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update event." };
  }

  if (!updated) {
    return { error: "Event not found." };
  }

  revalidatePath("/dashboard/admin/management/events");
  revalidatePath("/dashboard/events/check-in");
  return { success: "Event updated." };
}

export async function removeEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Event id is required." };
  }

  try {
    const result = await deleteEventIfNoCheckins(id);
    if (result.notFound) {
      return { error: "Event not found." };
    }
    if (!result.deleted) {
      return { error: `Cannot delete event. ${result.checkins} check-in(s) exist.` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete event." };
  }

  revalidatePath("/dashboard/admin/management/events");
  revalidatePath("/dashboard/admin/management");
  revalidatePath("/dashboard/events/check-in");
  return { success: "Event deleted." };
}
