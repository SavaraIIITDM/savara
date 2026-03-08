"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { sendActivationCodeEmail } from "@/lib/email/gmail";

export async function verifyPurchaseAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const purchaserEmail = String(formData.get("purchaserEmail") ?? "").trim().toLowerCase();
  const ticketCount = Number(formData.get("ticketCount") ?? 0);
  const purchaseType = String(formData.get("purchaseType") ?? "external").trim().toLowerCase();
  const notifyByEmail = String(formData.get("notifyByEmail") ?? "").toLowerCase() === "on";

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
  const ticketAssigned = data[0].ticket_assigned;

  if (notifyByEmail) {
    try {
      await sendActivationCodeEmail({
        to: purchaserEmail,
        activationCode,
        ticketCount,
      });
    } catch (emailError) {
      return {
        error:
          emailError instanceof Error
            ? `Code generated (${activationCode}) but email failed: ${emailError.message}`
            : `Code generated (${activationCode}) but email failed.`,
      };
    }
  }

  revalidatePath("/dashboard/admin/purchases");
  revalidatePath("/dashboard/ticket");

  return {
    success: `Purchase verified. Activation code ${activationCode} generated for ${purchaserEmail}.${ticketAssigned ? " Ticket auto-assigned to purchaser account." : ""}${notifyByEmail ? " Email sent." : ""}`,
  };
}
