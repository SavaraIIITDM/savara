import { createClient } from "@/lib/supabase/server";

export async function getPendingActivationCodeForEmail(email: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (profile?.id) {
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingTicket?.id) {
      return null;
    }
  }

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
