import Link from "next/link";
import { ShieldCheck, Ticket, CalendarDays, ClipboardList, Gift, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { getManagementHubStats } from "@/lib/db/queries";

const cardStyle = {
  borderColor: "rgba(212, 165, 116, 0.2)",
  background: "rgba(42, 31, 26, 0.42)",
};

export default async function ManagementHubPage() {
  await requireAdmin();
  const stats = await getManagementHubStats();

  const sections = [
    {
      href: "/dashboard/admin/management/volunteers",
      title: "Volunteer Management",
      description: "Grant and revoke volunteer access for check-in operations.",
      badge: `${stats.volunteers} volunteers`,
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/admin/management/tickets",
      title: "Ticket & Codes",
      description: "Investigate and manage activation codes and issued tickets.",
      badge: `${stats.activeCodes} active codes`,
      icon: Ticket,
    },
    {
      href: "/dashboard/admin/management/events",
      title: "Event Management",
      description: "Create and maintain event metadata and active status.",
      badge: `${stats.events} events`,
      icon: CalendarDays,
    },
    {
      href: "/dashboard/admin/management/checkins",
      title: "Check-in Audit",
      description: "Review and undo accidental event check-ins.",
      badge: `${stats.checkins} check-ins`,
      icon: ClipboardList,
    },
    {
      href: "/dashboard/admin/management/perks",
      title: "Perk Management",
      description: "Control perk availability and review perk redemptions.",
      badge: `${stats.perks} perks`,
      icon: Gift,
    },
    {
      href: "/dashboard/admin/management/teams",
      title: "Team Management",
      description: "Resolve team disputes and remove invalid entries.",
      badge: `${stats.teams} teams`,
      icon: Users,
    },
  ];

  return (
    <section>
      <h1 className="text-2xl font-bold uppercase">Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Admin-only control center for operations during pre-fest and fest-day workflows.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="rounded-xl border p-5 transition hover:scale-[1.01]" style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon size={18} />
                    <h2 className="text-lg font-bold uppercase">{section.title}</h2>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                    {section.description}
                  </p>
                </div>
                <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
                  {section.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
