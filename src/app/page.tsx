import HomeStoryboard from "@/components/HomeStoryboard";
import { AnnouncementPopup } from "@/components/AnnouncementPopup";
import { getLatestAnnouncement } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latest = await getLatestAnnouncement();

  return (
    <>
      <HomeStoryboard />
      <AnnouncementPopup
        announcement={
          latest
            ? {
                id: latest.id,
                title: latest.title,
                body: latest.body,
                createdAt: latest.createdAt.toISOString(),
              }
            : null
        }
      />
    </>
  );
}
