"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function verifyPurchaseAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const purchaserEmail = String(formData.get("purchaserEmail") ?? "").trim().toLowerCase();
  const ticketCount = Number(formData.get("ticketCount") ?? 0);
  const purchaseType = String(formData.get("purchaseType") ?? "external").trim().toLowerCase();

  if (!purchaserEmail || !purchaserEmail.includes("@")) {
    return { error: "Valid purchaser email is required." };
  }

  if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
    return { error: "Ticket count must be between 1 and 10." };
  }

  if (purchaseType !== "internal" && purchaseType !== "external") {
    return { error: "Purchase type must be internal or external." };
  }

  const { data, error } = await supabase.rpc("admin_verify_purchase", {
    p_purchaser_email: purchaserEmail,
    p_ticket_quota: ticketCount,
    p_purchase_type: purchaseType,
  });

  if (error || !data?.[0]) {
    return { error: error?.message ?? "Unable to verify purchase." };
  }

  const activationCode = data[0].code;

  revalidatePath("/dashboard/admin/purchases");
  revalidatePath("/dashboard/ticket");

  return {
    success: `Purchase verified. Activation code ${activationCode} generated for ${purchaserEmail}.`,
  };
}
