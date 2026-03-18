import { getPendingActivationCodeForEmailDb } from "@/lib/db/queries";

export async function getPendingActivationCodeForEmail(email: string) {
  return getPendingActivationCodeForEmailDb(email);
}
