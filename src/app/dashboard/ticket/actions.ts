"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/guards";
import { redeemActivationCode } from "@/lib/db/queries";

export async function redeemTicketAction(formData: FormData) {
  const user = await requireDashboardUser();

  const activationCode = String(formData.get("activationCode") ?? "").trim().toUpperCase();
  if (!activationCode) {
    return { error: "Activation code is required." };
  }

  try {
    await redeemActivationCode(user.id, user.email, activationCode);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to redeem activation code." };
  }

  revalidatePath("/dashboard/ticket");
  return { success: "Ticket activated successfully." };
}
