import { requireAdmin } from "@/lib/auth/guards";
import { listEventsForManagement } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { CheckinsManager } from "@/components/dashboard/management/CheckinsManager";

export default async function ManagementCheckinsPage() {
  await requireAdmin();
  const events = await listEventsForManagement();

  return (
    <section>
      <ManagementBreadcrumb section="Check-in Audit" />
      <h1 className="text-2xl font-bold uppercase">Check-in Audit</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Read-only audit log with inline removal for accidental event check-ins.
      </p>
      <div className="mt-4">
        <CheckinsManager events={(events ?? []).map((event) => ({ id: event.id, name: event.name }))} />
      </div>
    </section>
  );
}
