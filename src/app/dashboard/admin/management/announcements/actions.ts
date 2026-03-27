"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createAnnouncement, deleteAnnouncement } from "@/lib/db/queries";

export async function publishAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }
  if (!body) {
    return { error: "Body is required." };
  }

  let created:
    | {
        id: string;
        title: string;
        body: string;
        createdBy: string;
        createdAt: Date;
      }
    | undefined;

  try {
    created = await createAnnouncement({
      title,
      body,
      createdBy: admin.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to publish announcement." };
  }

  if (!created) {
    return { error: "Unable to publish announcement." };
  }

  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/dashboard/admin/management/announcements");
  revalidatePath("/dashboard/admin/management");

  return {
    success: "Announcement published.",
    announcement: {
      id: created.id,
      title: created.title,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      ageSeconds: 0,
    },
  };
}

export async function deleteAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Announcement id is required." };
  }

  let removed = false;
  try {
    removed = await deleteAnnouncement(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete announcement." };
  }

  if (!removed) {
    return { error: "Announcement not found." };
  }

  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/dashboard/admin/management/announcements");
  revalidatePath("/dashboard/admin/management");

  return { success: "Announcement deleted." };
}
