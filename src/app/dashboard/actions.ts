"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/guards";
import { updateCertificateNameOnce } from "@/lib/db/queries";

export async function updateCertificateNameAction(formData: FormData) {
  const user = await requireDashboardUser();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) {
    return { error: "Name is required." };
  }

  if (fullName.length > 80) {
    return { error: "Name must be 80 characters or fewer." };
  }

  try {
    await updateCertificateNameOnce(user.id, fullName);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update certificate name." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pcertificates");
  revalidatePath("/dashboard/ticket");

  return { success: "Certificate name updated.", updatedName: fullName };
}
