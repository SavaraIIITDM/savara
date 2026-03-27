import { listAnnouncements } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function absoluteTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-16 pt-28 sm:px-8">
      <section className="rounded-xl border p-6" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
          Updates from the Savara team
        </p>

        {(announcements ?? []).length === 0 ? (
          <p className="mt-6 text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
            No announcements yet.
          </p>
        ) : (
          <div className="mt-6">
            {(announcements ?? []).map((item, index) => (
              <article key={item.id} className={index > 0 ? "mt-6 border-t pt-6" : ""} style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm" style={{ color: "rgba(245, 230, 211, 0.9)" }}>
                  {item.body}
                </p>
                <p className="mt-3 font-mono text-xs" style={{ color: "rgba(245, 230, 211, 0.64)" }}>
                  {absoluteTime(item.createdAt.toISOString())}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
