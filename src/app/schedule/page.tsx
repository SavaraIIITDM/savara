"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import scheduleData from "@/data/schedule.json";

type RawScheduleEvent = {
  name: string;
  slug: string | null;
  start_time: string;
  end_time: string;
  event_type: string;
  location: string;
};

type FilterKey = "all" | "flagship" | "formal" | "informal";

type DayMeta = {
  day: string;
  date: string;
  weekday: string;
};

type EventItem = {
  id: string;
  day: string;
  dayLabel: string;
  name: string;
  slug: string | null;
  start: string;
  end: string;
  eventType: string;
  category: Exclude<FilterKey, "all"> | "special";
  location: string;
};

const DAY_META: Record<string, DayMeta> = {
  "1": { day: "Day 1", date: "Mar 27", weekday: "Friday" },
  "2": { day: "Day 2", date: "Mar 28", weekday: "Saturday" },
  "3": { day: "Day 3", date: "Mar 29", weekday: "Sunday" },
  "4": { day: "Day 4", date: "Mar 30", weekday: "Monday" },
  "5": { day: "Day 5", date: "Mar 31", weekday: "Tuesday" },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "flagship", label: "Flagship" },
  { key: "formal", label: "Formal" },
  { key: "informal", label: "Informal" },
];

const STYLE_BY_CATEGORY: Record<
  EventItem["category"],
  { label: string; accent: string; glow: string; surface: string }
> = {
  flagship: {
    label: "FLAGSHIP",
    accent: "#d4a574",
    glow: "rgba(212, 165, 116, 0.22)",
    surface: "rgba(212, 165, 116, 0.12)",
  },
  formal: {
    label: "FORMAL",
    accent: "#f09431",
    glow: "rgba(240, 148, 49, 0.18)",
    surface: "rgba(240, 148, 49, 0.1)",
  },
  informal: {
    label: "INFORMAL",
    accent: "#7c4dff",
    glow: "rgba(124, 77, 255, 0.2)",
    surface: "rgba(124, 77, 255, 0.11)",
  },
  special: {
    label: "SPECIAL",
    accent: "#df4343",
    glow: "rgba(111, 16, 16, 0.22)",
    surface: "rgba(111, 16, 16, 0.12)",
  },
};

function classifyCategory(eventType: string): EventItem["category"] {
  if (eventType === "flagship" || eventType === "cult_flagship")
    return "flagship";
  if (
    eventType === "formal" ||
    eventType === "tech_formal" ||
    eventType === "cult_formal"
  )
    return "formal";
  if (
    eventType === "informal" ||
    eventType === "tech_informal" ||
    eventType === "cult_informal"
  )
    return "informal";
  return "special";
}

function toMinutes(raw: string): number {
  const hours = Number(raw.slice(0, 2));
  const minutes = Number(raw.slice(2, 4));
  return hours * 60 + minutes;
}

function formatClock(raw: string): string {
  const minutes = toMinutes(raw);
  const hrs24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const suffix = hrs24 >= 12 ? "PM" : "AM";
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  return `${hrs12}:${mins.toString().padStart(2, "0")} ${suffix}`;
}

function shortDuration(start: string, end: string): string {
  const total = Math.max(0, toMinutes(end) - toMinutes(start));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function longDuration(start: string, end: string): string {
  const total = Math.max(0, toMinutes(end) - toMinutes(start));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours} hours ${mins} minutes`;
  if (hours === 1) return "1 hour";
  if (hours > 1) return `${hours} hours`;
  if (mins === 1) return "1 minute";
  return `${mins} minutes`;
}

function toEventUrl(event: EventItem): string | null {
  if (!event.slug) return null;
  const stream = event.eventType.startsWith("cult_") ? "cultural" : "technical";
  return `/events/${stream}/${event.slug}`;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function eventSearchBlob(event: EventItem): string {
  return [event.name, event.location, event.eventType, event.dayLabel]
    .join(" ")
    .toLowerCase();
}

function EventCard({
  event,
  expanded,
  onToggle,
  registerRef,
  showDayPill,
  onJump,
}: {
  event: EventItem;
  expanded: boolean;
  onToggle: (id: string) => void;
  registerRef?: (node: HTMLDivElement | null) => void;
  showDayPill?: boolean;
  onJump?: (event: EventItem) => void;
}) {
  const style = STYLE_BY_CATEGORY[event.category];
  const viewUrl = toEventUrl(event);

  return (
    <article
      ref={registerRef}
      className="group relative overflow-hidden rounded-2xl border px-4 py-4 transition-all duration-300 sm:px-5"
      style={{
        borderColor: "rgba(245, 230, 211, 0.2)",
        background:
          "linear-gradient(135deg, rgba(42,31,26,0.9) 0%, rgba(10,4,8,0.86) 70%), radial-gradient(circle at 90% 0%, rgba(74,16,111,0.22), transparent 42%)",
        boxShadow: expanded
          ? "0 0 24px rgba(245,230,211,0.12)"
          : "0 8px 22px rgba(0,0,0,0.28)",
      }}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onToggle(event.id)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.18em]"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  color: style.accent,
                  borderColor: `${style.accent}66`,
                  backgroundColor: style.surface,
                }}
              >
                {style.label}
              </span>
              {showDayPill ? (
                <span
                  className="rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.76)",
                    borderColor: "rgba(245,230,211,0.22)",
                    backgroundColor: "rgba(245,230,211,0.06)",
                  }}
                >
                  {event.dayLabel}
                </span>
              ) : null}

              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  color: "rgba(245, 230, 211, 0.74)",
                }}
              >
                <MapPin
                  size={12}
                  aria-hidden="true"
                  style={{ color: "rgba(245, 230, 211, 0.58)" }}
                />
                <span>{event.location}</span>
              </span>
            </div>

            <h3
              className="text-lg font-bold leading-tight sm:text-xl"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: "var(--savara-cream)",
              }}
            >
              {event.name}
            </h3>
          </div>

          <div className="text-right">
            <p
              className="text-xs font-semibold tracking-[0.14em]"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: style.accent,
              }}
            >
              {shortDuration(event.start, event.end)}
            </p>
            <p
              className="mt-1 text-base"
              style={{ color: "rgba(245,230,211,0.7)" }}
            >
              {expanded ? "−" : "+"}
            </p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div
          className="mt-4 border-t pt-4"
          style={{ borderColor: "rgba(245, 230, 211, 0.14)" }}
        >
          <div className="grid grid-cols-[78px_1fr] gap-x-4 gap-y-2">
            <span
              className="text-[11px] font-light uppercase tracking-[0.14em]"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                color: "rgba(245,230,211,0.58)",
              }}
            >
              Time
            </span>
            <span
              className="text-sm"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: "rgba(245,230,211,0.86)",
              }}
            >
              {formatClock(event.start)} to {formatClock(event.end)}
            </span>

            <span
              className="text-[11px] font-light uppercase tracking-[0.14em]"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                color: "rgba(245,230,211,0.58)",
              }}
            >
              Venue
            </span>
            <span
              className="text-sm"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: "rgba(245,230,211,0.86)",
              }}
            >
              {event.location}
            </span>

            <span
              className="text-[11px] font-light uppercase tracking-[0.14em]"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                color: "rgba(245,230,211,0.58)",
              }}
            >
              Duration
            </span>
            <span
              className="text-sm"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: "rgba(245,230,211,0.74)",
              }}
            >
              {longDuration(event.start, event.end)}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            {viewUrl ? (
              <Link
                href={viewUrl}
                className="inline-flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  borderColor: `${style.accent}88`,
                  background:
                    "linear-gradient(130deg, rgba(245,230,211,0.09), rgba(10,4,8,0.75))",
                  color: "var(--savara-cream)",
                }}
              >
                View Event
              </Link>
            ) : null}

            {onJump ? (
              <button
                type="button"
                onClick={() => onJump(event)}
                className="inline-flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em]"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  color: "rgba(245,230,211,0.86)",
                  borderColor: "rgba(245,230,211,0.3)",
                  backgroundColor: "rgba(245,230,211,0.06)",
                }}
              >
                Jump to Slot
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function SchedulePage() {
  const dayKeys = useMemo(
    () => Object.keys(scheduleData).sort((a, b) => Number(a) - Number(b)),
    [],
  );
  const [activeDay, setActiveDay] = useState(dayKeys[0] ?? "1");
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>(["all"]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const handledScrollId = useRef<string | null>(null);

  const eventsByDay = useMemo(() => {
    const mapped: Record<string, EventItem[]> = {};

    for (const dayKey of dayKeys) {
      const dayName = DAY_META[dayKey]?.day ?? `Day ${dayKey}`;
      const rawDay =
        (scheduleData as Record<string, RawScheduleEvent[]>)[dayKey] ?? [];

      mapped[dayKey] = [...rawDay]
        .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
        .map((event, index) => ({
          id: `${dayKey}-${event.start_time}-${event.slug ?? event.name}-${index}`,
          day: dayKey,
          dayLabel: dayName,
          name: event.name,
          slug: event.slug,
          start: event.start_time,
          end: event.end_time,
          eventType: event.event_type,
          category: classifyCategory(event.event_type),
          location: event.location,
        }));
    }

    return mapped;
  }, [dayKeys]);

  const timelineEvents = useMemo(() => {
    const includeAll = activeFilters.includes("all");
    const activeDayEvents = eventsByDay[activeDay] ?? [];

    return activeDayEvents
      .filter(
        (event) =>
          includeAll || activeFilters.includes(event.category as FilterKey),
      )
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [activeDay, activeFilters, eventsByDay]);

  const groupedTimeline = useMemo(() => {
    const grouped = new Map<string, EventItem[]>();
    for (const event of timelineEvents) {
      const at = grouped.get(event.start);
      if (at) at.push(event);
      else grouped.set(event.start, [event]);
    }
    return Array.from(grouped.entries()).map(([time, events]) => ({
      time,
      events,
    }));
  }, [timelineEvents]);

  const hasSearch = normalize(searchQuery).length > 0;

  const searchResults = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return [];

    return dayKeys
      .flatMap((dayKey) => eventsByDay[dayKey] ?? [])
      .filter((event) => eventSearchBlob(event).includes(q))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [dayKeys, eventsByDay, searchQuery]);

  const jumpToEvent = (event: EventItem) => {
    setActiveDay(event.day);
    setActiveFilters(["all"]);
    setExpandedId(event.id);
    setSearchQuery("");
    handledScrollId.current = null;
    setPendingScrollId(event.id);
  };

  const onSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchResults.length) return;
    jumpToEvent(searchResults[0]);
  };

  const toggleFilter = (next: FilterKey) => {
    setExpandedId(null);
    setActiveFilters((prev) => {
      if (next === "all") return ["all"];

      const withoutAll = prev.filter((item) => item !== "all");
      const has = withoutAll.includes(next);
      const updated = has
        ? withoutAll.filter((item) => item !== next)
        : [...withoutAll, next];

      return updated.length ? updated : ["all"];
    });
  };

  useEffect(() => {
    if (!pendingScrollId) return;
    if (handledScrollId.current === pendingScrollId) return;

    const target = cardRefs.current[pendingScrollId];
    if (!target) return;

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      handledScrollId.current = pendingScrollId;
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pendingScrollId, activeDay, groupedTimeline.length]);

  return (
    <main
      className="relative min-h-screen px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 10% 5%, rgba(209,29,29,0.22), transparent 36%), radial-gradient(circle at 90% 12%, rgba(74,16,111,0.26), transparent 34%), linear-gradient(180deg, #0a0408 0%, #14090f 44%, #0a0408 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(212,165,116,0.5) 1px, transparent 1px), linear-gradient(-45deg, rgba(212,165,116,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="pb-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.24em]"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245,230,211,0.58)",
            }}
          >
            SAVARA 2026
          </p>
          <h1
            className="mt-2 text-3xl font-black uppercase leading-tight sm:text-5xl"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              background:
                "linear-gradient(120deg, #f5e6d3 0%, #f09431 42%, #d11d1d 72%, #4a106f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Savara 2026 - Schedule
          </h1>
        </header>

        <section
          className="sticky top-24 z-30 -mx-2 rounded-2xl border p-2 backdrop-blur-xl sm:top-28 sm:mx-0"
          style={{
            borderColor: "rgba(212,165,116,0.22)",
            background:
              "linear-gradient(135deg, rgba(20,9,15,0.9), rgba(10,4,8,0.8)), radial-gradient(circle at 100% 0, rgba(240,148,49,0.13), transparent 42%)",
          }}
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dayKeys.map((dayKey) => {
              const meta = DAY_META[dayKey] ?? {
                day: `Day ${dayKey}`,
                date: "",
                weekday: "",
              };

              const isActive = activeDay === dayKey;
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => {
                    setActiveDay(dayKey);
                    setExpandedId(null);
                  }}
                  className="min-w-max rounded-xl border px-3 py-2 text-left transition-all"
                  style={{
                    borderColor: isActive
                      ? "rgba(240,148,49,0.6)"
                      : "rgba(245,230,211,0.16)",
                    background: isActive
                      ? "rgba(240,148,49,0.12)"
                      : "rgba(245,230,211,0.05)",
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{
                      fontFamily: "var(--font-cinzel), serif",
                      color: isActive
                        ? "var(--savara-light-gold)"
                        : "rgba(245,230,211,0.86)",
                    }}
                  >
                    {meta.day}
                  </p>
                  <p
                    className="text-[11px] tracking-[0.08em]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: isActive
                        ? "rgba(245,230,211,0.9)"
                        : "rgba(245,230,211,0.55)",
                    }}
                  >
                    {meta.date} - {meta.weekday}
                  </p>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSearchSubmit} className="mt-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                borderColor: "rgba(245,230,211,0.2)",
                backgroundColor: "rgba(10,4,8,0.55)",
                color: "var(--savara-cream)",
                boxShadow: "inset 0 1px 12px rgba(0,0,0,0.24)",
              }}
            />
          </form>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => {
              const active = activeFilters.includes(filter.key);
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => toggleFilter(filter.key)}
                  className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    borderColor: active
                      ? "rgba(212,165,116,0.65)"
                      : "rgba(245,230,211,0.16)",
                    background: active
                      ? "linear-gradient(120deg, rgba(240,148,49,0.2), rgba(74,16,111,0.2))"
                      : "rgba(245,230,211,0.04)",
                    color: active
                      ? "var(--savara-light-gold)"
                      : "rgba(245,230,211,0.7)",
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          {hasSearch ? (
            <div className="space-y-3">
              {searchResults.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={(id) =>
                    setExpandedId((curr) => (curr === id ? null : id))
                  }
                  showDayPill
                  onJump={jumpToEvent}
                />
              ))}

              {searchResults.length === 0 ? (
                <div
                  className="rounded-2xl border py-16 text-center"
                  style={{
                    borderColor: "rgba(245,230,211,0.16)",
                    backgroundColor: "rgba(245,230,211,0.04)",
                    color: "rgba(245,230,211,0.72)",
                    fontFamily: "var(--font-rajdhani), sans-serif",
                  }}
                >
                  No matching events found.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative pl-2 sm:pl-5">
              <div
                className="absolute bottom-0 left-0 top-0 w-px sm:left-[4px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(212,165,116,0.12) 0%, rgba(212,165,116,0.45) 45%, rgba(212,165,116,0.12) 100%)",
                }}
              />

              <div className="space-y-7">
                {groupedTimeline.map((slot) => (
                  <div key={slot.time} className="relative">
                    <div className="relative mb-2 flex min-h-4 items-center pl-4 sm:pl-5">
                      <span
                        className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border sm:left-[4px]"
                        style={{
                          backgroundColor: "rgba(240,148,49,0.6)",
                          borderColor: "rgba(245,230,211,0.5)",
                          boxShadow: "0 0 16px rgba(240,148,49,0.45)",
                        }}
                      />
                      <p
                        className="text-xs font-bold leading-none sm:text-sm"
                        style={{
                          fontFamily: "var(--font-cinzel), serif",
                          color: "rgba(245,230,211,0.86)",
                        }}
                      >
                        {formatClock(slot.time).split(" ")[0]}{" "}
                        <span
                          className="text-[10px] tracking-[0.14em]"
                          style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            color: "rgba(245,230,211,0.56)",
                          }}
                        >
                          {formatClock(slot.time).split(" ")[1]}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      {slot.events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          expanded={expandedId === event.id}
                          onToggle={(id) =>
                            setExpandedId((curr) => (curr === id ? null : id))
                          }
                          registerRef={(node) => {
                            cardRefs.current[event.id] = node;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {groupedTimeline.length === 0 ? (
                  <div
                    className="rounded-2xl border py-16 text-center"
                    style={{
                      borderColor: "rgba(245,230,211,0.16)",
                      backgroundColor: "rgba(245,230,211,0.04)",
                      color: "rgba(245,230,211,0.72)",
                      fontFamily: "var(--font-rajdhani), sans-serif",
                    }}
                  >
                    No events found for this day and filter.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
