import { requireAdmin } from "@/lib/auth/guards";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { TicketsManager } from "@/components/dashboard/management/TicketsManager";

export default async function ManagementTicketsPage() {
  await requireAdmin();

  return (
    <section>
      <ManagementBreadcrumb section="Ticket & Activation Code Management" />
      <h1 className="text-2xl font-bold uppercase">Ticket & Activation Code Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Search by activation code or by email and run remediation actions inline.
      </p>
      <div className="mt-4">
        <TicketsManager />
      </div>
    </section>
  );
}
