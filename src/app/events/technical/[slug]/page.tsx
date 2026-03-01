import { notFound } from "next/navigation";
import eventDetails from "@/data/event_details.json";
import { slugify } from "@/lib/slugify";
import TechEventDetailPage from "@/components/TechEventDetailPage";

const TECH_TYPES = ["flagship", "tech_formal", "tech_informal"];

const techEvents = eventDetails.filter((e) => TECH_TYPES.includes(e.event_type));

export function generateStaticParams() {
    return techEvents.map((e) => ({ slug: slugify(e.event_name) }));
}

export default async function TechEventPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = techEvents.find((e) => slugify(e.event_name) === slug);

    if (!event) return notFound();

    return <TechEventDetailPage event={event} />;
}
