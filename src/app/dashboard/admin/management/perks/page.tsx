import { requireAdmin } from "@/lib/auth/guards";
import { listPerksForManagement } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { PerksManager } from "@/components/dashboard/management/PerksManager";

export default async function ManagementPerksPage() {
  await requireAdmin();
  const perks = await listPerksForManagement();

  return (
    <section>
      <ManagementBreadcrumb section="Perk Management & Audit" />
      <h1 className="text-2xl font-bold uppercase">Perk Management & Audit</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Manage perk lifecycle and audit perk redemptions from one page.
      </p>
      <div className="mt-4">
        <PerksManager
          initialPerks={(perks ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            isActive: row.isActive,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </section>
  );
}
