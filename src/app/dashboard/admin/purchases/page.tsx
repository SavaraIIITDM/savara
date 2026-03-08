import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AdminVerifyPurchaseForm } from "@/components/dashboard/AdminVerifyPurchaseForm";

export default async function AdminPurchasesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: recentCodes } = await supabase
    .from("activation_codes")
    .select("code, purchaser_email, ticket_quota, redeemed_count, purchase_type, verified_at")
    .order("verified_at", { ascending: false })
    .limit(20);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article
        className="rounded-xl border p-5"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h1 className="text-2xl font-bold uppercase">Verify Purchase</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
          Enter purchaser email and ticket count. Verification generates code, auto-assigns ticket if purchaser account exists, and can optionally send email.
        </p>
        <AdminVerifyPurchaseForm />
      </article>

      <article
        className="rounded-xl border p-5"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h2 className="text-2xl font-bold uppercase">Recent Activation Codes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                <th className="py-2">Code</th>
                <th className="py-2">Email</th>
                <th className="py-2">Type</th>
                <th className="py-2">Used</th>
              </tr>
            </thead>
            <tbody>
              {(recentCodes ?? []).map((row) => (
                <tr key={row.code} className="border-t" style={{ borderColor: "rgba(212, 165, 116, 0.14)" }}>
                  <td className="py-2 font-semibold">{row.code}</td>
                  <td className="py-2">{row.purchaser_email}</td>
                  <td className="py-2 uppercase">{row.purchase_type}</td>
                  <td className="py-2">
                    {row.redeemed_count}/{row.ticket_quota}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
