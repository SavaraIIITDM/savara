import Link from "next/link";
import { requireDashboardRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await requireDashboardRole();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-16 pt-28 sm:px-8">
      <section
        className="rounded-xl border px-4 py-4 sm:px-5"
        style={{
          background: "rgba(42, 31, 26, 0.55)",
          borderColor: "rgba(212, 165, 116, 0.2)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
              Dashboard
            </p>
            <p className="mt-1 text-sm" style={{ color: "rgba(245, 230, 211, 0.85)" }}>
              {role.email} · {role.participantType} participant
            </p>
            <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
              Permissions: {role.isAdmin ? "admin" : role.isVolunteer ? "volunteer" : "participant"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.24)" }} href="/dashboard">
              Home
            </Link>
            <Link className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.24)" }} href="/dashboard/ticket">
              Ticket
            </Link>
            {(role.isVolunteer || role.isAdmin) && (
              <>
                <Link className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.24)" }} href="/dashboard/events/check-in">
                  Event Check-In
                </Link>
                <Link className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.24)" }} href="/dashboard/perks/check-in">
                  Perk Check-In
                </Link>
              </>
            )}
            {role.isAdmin && (
              <Link className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.24)" }} href="/dashboard/admin/purchases">
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md px-3 py-2 text-sm font-medium"
                style={{ background: "var(--savara-gold)", color: "#0a0408" }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="mt-6">{children}</div>
    </main>
  );
}
