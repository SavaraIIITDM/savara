import EventsCategoryPage, { type EventItem } from "@/components/EventsCategoryPage";
import eventDetails from "@/data/event_details.json";

const technicalEvents = (eventDetails as EventItem[])
  .filter(
    (event) =>
      event.event_type === "tech_formal" ||
      event.event_type === "tech_informal" ||
      event.event_type === "flagship"
  )
  .sort((a, b) => b.prize_pool - a.prize_pool);

export default function TechnicalEventsPage() {
  return (
    <EventsCategoryPage
      title="Technical Events"
      subtitle="Build, break, and innovate"
      description="A common hub for all technical events — hackathons, robotics, security, design, and more. Explore every competition and workshop."
      accent="#7c4dff"
      accentSoft="rgba(124, 77, 255, 0.55)"
      background="radial-gradient(circle at top right, rgba(124,77,255,0.3), transparent 55%), radial-gradient(circle at bottom left, rgba(26,0,51,0.65), #05030a 70%)"
      events={technicalEvents}
      basePath="/events/technical"
    />
  );
}
