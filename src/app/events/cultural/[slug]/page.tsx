import { notFound } from "next/navigation";
import eventDetails from "@/data/event_details.json";
import { slugify } from "@/lib/slugify";
import CultEventDetailPage from "@/components/CultEventDetailPage";

const CULT_TYPES = ["cult_flagship", "cult_formal", "cult_informal"];

const cultEvents = eventDetails.filter((e) => CULT_TYPES.includes(e.event_type));

export function generateStaticParams() {
    return cultEvents.map((e) => ({ slug: slugify(e.event_name) }));
}

export default async function CultEventPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = cultEvents.find((e) => slugify(e.event_name) === slug);

    if (!event) return notFound();

    return <CultEventDetailPage event={event} />;
}
