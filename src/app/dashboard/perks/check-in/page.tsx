import { requireVolunteerOrAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PerkCheckInForms } from "@/components/dashboard/PerkCheckInForms";

export default async function PerkCheckInPage() {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const { data: perks } = await supabase
    .from("perks")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <>
      {(perks ?? []).length === 0 ? (
        <section
          className="rounded-xl border p-5"
          style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
        >
          <h1 className="text-2xl font-bold uppercase">Perk Check-In</h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            No perks configured yet.
          </p>
        </section>
      ) : (
        <PerkCheckInForms perks={(perks ?? []).map((perk) => ({ id: perk.id, name: perk.name }))} />
      )}
    </>
  );
}
