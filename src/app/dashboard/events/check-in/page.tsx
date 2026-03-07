import { requireVolunteerOrAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CheckInForms } from "@/components/dashboard/CheckInForms";

export default async function EventCheckInPage() {
  await requireVolunteerOrAdmin();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, team_min_size, team_max_size")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <>
      {(events ?? []).length === 0 ? (
        <section
          className="rounded-xl border p-5"
          style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
        >
          <h1 className="text-2xl font-bold uppercase">Event Check-In</h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            No events available yet. Add events in the database before volunteer check-in starts.
          </p>
        </section>
      ) : (
        <CheckInForms
          events={(events ?? []).map((event) => ({
            id: event.id,
            name: event.name,
            teamMinSize: event.team_min_size,
            teamMaxSize: event.team_max_size,
          }))}
        />
      )}
    </>
  );
}
