"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { verifyPurchase } from "@/lib/db/queries";
import { sendActivationCodeEmail } from "@/lib/email/gmail";
import { sendActivationCodeEmailViaResend } from "@/lib/email/resend";

const GMAIL_TIMEOUT_MS = 5000;

async function sendGmailWithTimeout(params: { to: string; activationCode: string; ticketCount: number }) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      sendActivationCodeEmail(params),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("failed"));
        }, GMAIL_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function verifyPurchaseAction(formData: FormData) {
  const user = await requireAdmin();

  const purchaserEmail = String(formData.get("purchaserEmail") ?? "").trim().toLowerCase();
  const ticketCount = Number(formData.get("ticketCount") ?? 0);
  const purchaseType = String(formData.get("purchaseType") ?? "external").trim().toLowerCase();
  const emailProvider = String(formData.get("emailProvider") ?? "").trim().toLowerCase();

  if (!purchaserEmail || !purchaserEmail.includes("@")) {
    return { error: "Valid purchaser email is required." };
  }

  if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
    return { error: "Ticket count must be between 1 and 10." };
  }

  if (purchaseType !== "internal" && purchaseType !== "external") {
    return { error: "Purchase type must be internal or external." };
  }

  if (emailProvider !== "gmail" && emailProvider !== "resend") {
    return { error: "Email provider is required (GMail or Resend)." };
  }

  let result: { code: string; ticket_assigned: boolean };
  try {
    result = await verifyPurchase({
      purchaserEmail,
      ticketCount,
      purchaseType: purchaseType as "internal" | "external",
      actorUserId: user.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to verify purchase." };
  }

  const activationCode = result.code;
  const ticketAssigned = result.ticket_assigned;

  try {
    if (emailProvider === "gmail") {
      await sendGmailWithTimeout({
        to: purchaserEmail,
        activationCode,
        ticketCount,
      });
    } else {
      await sendActivationCodeEmailViaResend({
        to: purchaserEmail,
        activationCode,
        ticketCount,
      });
    }
  } catch (emailError) {
    return {
      error:
        emailError instanceof Error
          ? `Code generated (${activationCode}) but ${emailProvider} email failed: ${emailError.message}`
          : `Code generated (${activationCode}) but ${emailProvider} email failed.`,
    };
  }

  revalidatePath("/dashboard/admin/purchases");
  revalidatePath("/dashboard/ticket");

  return {
    success: `Purchase verified. Activation code ${activationCode} generated for ${purchaserEmail}.${ticketAssigned ? " Ticket auto-assigned to purchaser account." : ""} Email sent via ${emailProvider === "gmail" ? "GMail" : "Resend"}.`,
  };
}
