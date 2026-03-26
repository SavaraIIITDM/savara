import { requireAdmin } from "@/lib/auth/guards";
import { listVolunteers } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { VolunteersManager } from "@/components/dashboard/management/VolunteersManager";

export default async function ManagementVolunteersPage() {
  const admin = await requireAdmin();
  const volunteers = await listVolunteers();

  return (
    <section>
      <ManagementBreadcrumb section="Volunteer Management" />
      <h1 className="text-2xl font-bold uppercase">Volunteer Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Add and revoke volunteer role grants before and during the fest.
      </p>
      <div className="mt-4">
        <VolunteersManager
          initialVolunteers={(volunteers ?? []).map((volunteer) => ({
            email: volunteer.email,
            isAdmin: volunteer.isAdmin,
            isVolunteer: volunteer.isVolunteer,
            isEventVolunteer: volunteer.isEventVolunteer,
            isPerkVolunteer: volunteer.isPerkVolunteer,
          }))}
          currentAdminEmail={admin.email}
        />
      </div>
    </section>
  );
}
