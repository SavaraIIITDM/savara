import { requireAdmin } from "@/lib/auth/guards";
import { listEventsForManagement } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { EventsManager } from "@/components/dashboard/management/EventsManager";

export default async function ManagementEventsPage() {
  await requireAdmin();
  const events = await listEventsForManagement();

  return (
    <section>
      <ManagementBreadcrumb section="Event Management" />
      <h1 className="text-2xl font-bold uppercase">Event Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Create, update, and retire events while preserving check-in integrity.
      </p>
      <div className="mt-4">
        <EventsManager
          initialEvents={(events ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            teamMinSize: row.teamMinSize,
            teamMaxSize: row.teamMaxSize,
            isActive: row.isActive,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </section>
  );
}
