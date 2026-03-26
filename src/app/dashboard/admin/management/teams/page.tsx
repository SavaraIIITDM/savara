import { requireAdmin } from "@/lib/auth/guards";
import { listEventsForManagement } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { TeamsManager } from "@/components/dashboard/management/TeamsManager";

export default async function ManagementTeamsPage() {
  await requireAdmin();
  const events = await listEventsForManagement();

  return (
    <section>
      <ManagementBreadcrumb section="Team Management" />
      <h1 className="text-2xl font-bold uppercase">Team Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Resolve incorrect team composition and duplicate entries by event.
      </p>
      <div className="mt-4">
        <TeamsManager events={(events ?? []).map((event) => ({ id: event.id, name: event.name }))} />
      </div>
    </section>
  );
}
