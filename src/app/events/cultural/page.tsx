import EventsCategoryPage, { type EventItem } from "@/components/EventsCategoryPage";
import eventDetails from "@/data/event_details.json";

const culturalEvents = (eventDetails as EventItem[])
  .filter((event) => event.event_type === "cult_flagship" || event.event_type === "cult_formal" || event.event_type === "cult_informal")
  .sort((a, b) => b.prize_pool - a.prize_pool);

export default function CulturalEventsPage() {
  return (
    <EventsCategoryPage
      title="Cultural Events"
      subtitle="All things performance & art"
      description="Browse the full slate of cultural experiences — from spotlight nights to informal, late‑night sessions. Find your stage."
      accent="#e65100"
      accentSoft="rgba(230, 81, 0, 0.5)"
      background="radial-gradient(circle at top left, rgba(230,81,0,0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(198,40,40,0.35), #0a0408 70%)"
      events={culturalEvents}
      basePath="/events/cultural"
    />
  );
}
