import { requireAdmin } from "@/lib/auth/guards";
import { listAnnouncements } from "@/lib/db/queries";
import { ManagementBreadcrumb } from "@/components/dashboard/management/ManagementBreadcrumb";
import { AnnouncementsManager } from "@/components/dashboard/management/AnnouncementsManager";

export default async function ManagementAnnouncementsPage() {
  await requireAdmin();
  const announcements = await listAnnouncements();

  return (
    <section>
      <ManagementBreadcrumb section="Announcements" />
      <h1 className="text-2xl font-bold uppercase">Announcement Management</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Publish immediate updates for all users and remove outdated notices.
      </p>
      <div className="mt-4">
        <AnnouncementsManager
          initialAnnouncements={(announcements ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </section>
  );
}
