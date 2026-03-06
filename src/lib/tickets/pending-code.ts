import { createClient } from "@/lib/supabase/server";

export async function getPendingActivationCodeForEmail(email: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("activation_codes")
    .select("code, ticket_quota, redeemed_count, purchase_type, verified_at")
    .eq("purchaser_email", email.toLowerCase())
    .gt("ticket_quota", 0)
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const remaining = Math.max(data.ticket_quota - data.redeemed_count, 0);

  if (remaining === 0) {
    return null;
  }

  return {
    code: data.code,
    purchaseType: data.purchase_type,
    ticketQuota: data.ticket_quota,
    redeemedCount: data.redeemed_count,
    remaining,
    verifiedAt: data.verified_at,
  };
}
