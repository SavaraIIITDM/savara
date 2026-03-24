import Link from "next/link";
import { Users } from "lucide-react";

type EventData = {
    event_type: string;
    event_name: string;
    full_desc: string;
    short_desc: string;
    club_name: string;
    prize_pool: number;
    unstop_link: string;
    highlights?: string[];
    date?: string;
    time?: string;
    venue?: string;
    team_size?: string;
    registration_fee?: string;
};

export type DetailedEventData = {
    event_logo?: string;
    description_html?: string;
    eligibility?: {
        team_size?: {
            min?: number;
            max?: number;
        };
    };
    organizer?: {
        contacts?: Array<{
            name?: string;
            email?: string;
            phone?: string;
        }>;
    };
    prizes?: {
        winner?: { value?: string };
        runner_up?: { value?: string };
        second_runner_up?: { value?: string };
    };
    attachments?: Array<{ name?: string; url?: string }>;
    attachements?: Array<{ name?: string; url?: string }>;
};

type Props = {
    event: EventData;
    detailedEvent?: DetailedEventData | null;
};

const removeDataRangeAttributes = (html: string) =>
    html
        .replace(/\sdata-start=("[^"]*"|'[^']*')/g, "")
        .replace(/\sdata-end=("[^"]*"|'[^']*')/g, "");

export default function CultEventDetailPage({ event, detailedEvent }: Props) {
    const accent = "#e65100";
    const accentSoft = "rgba(230, 81, 0, 0.5)";
    const accentWarm = "#d4a574";
    const formatPrize = (v: number) => `₹${v.toLocaleString("en-IN")}`;

    const formatType = (t: string) => {
        if (t.includes("flagship")) return "Flagship";
        if (t.includes("formal") && !t.includes("informal")) return "Formal";
        return "Informal";
    };

    const detailedTeamSize = detailedEvent?.eligibility?.team_size;
    const teamSizeBadge = detailedTeamSize
        ? (detailedTeamSize.min ?? 1) === (detailedTeamSize.max ?? detailedTeamSize.min ?? 1)
            ? `${detailedTeamSize.max ?? detailedTeamSize.min ?? 1}`
            : `${detailedTeamSize.min ?? 1}-${detailedTeamSize.max ?? detailedTeamSize.min ?? 1}`
        : null;
    const aboutHtml = detailedEvent?.description_html
        ? removeDataRangeAttributes(detailedEvent.description_html)
        : null;
    const contacts = detailedEvent?.organizer?.contacts ?? [];
    const attachments = detailedEvent?.attachments ?? detailedEvent?.attachements ?? [];
    const hasUnstopLink = Boolean(event.unstop_link?.trim());

    return (
        <main
            className="min-h-screen px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-10"
            style={{
                background:
                    "radial-gradient(circle at top left, rgba(230,81,0,0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(198,40,40,0.35), #0a0408 70%)",
            }}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/events/cultural"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] transition-colors hover:text-[var(--savara-light-gold)] sm:text-sm"
                        style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            color: "var(--savara-gold)",
                        }}
                    >
                        <span className="text-base">←</span>
                        <span>Back to Cultural Events</span>
                    </Link>

                    <span
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] sm:text-xs"
                        style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            backgroundColor: "rgba(10,4,8,0.75)",
                            border: `1px solid ${accentSoft}`,
                            color: accent,
                            boxShadow:
                                event.event_type === "flagship" || event.event_type === "cult_flagship"
                                    ? "0 0 16px rgba(212, 165, 116, 0.45), 0 0 30px rgba(212, 165, 116, 0.25)"
                                    : "none",
                        }}
                    >
                        {formatType(event.event_type)}
                    </span>
                </div>

                <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/20 p-8 sm:p-10 md:p-12">
                    <div
                        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-[140px]"
                        style={{ background: "rgba(230, 81, 0, 0.6)" }}
                    />
                    <div
                        className="pointer-events-none absolute -left-20 bottom-0 h-60 w-60 rounded-full opacity-20 blur-[100px]"
                        style={{ background: "rgba(198, 40, 40, 0.4)" }}
                    />
                    <div
                        className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 rounded-full opacity-15 blur-[60px]"
                        style={{ background: accentWarm }}
                    />

                    <div
                        className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent}, ${accentWarm}, transparent)`,
                        }}
                    />

                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <p
                                className="mb-2 text-xs font-semibold uppercase tracking-[0.4em] sm:text-sm"
                                style={{
                                    fontFamily: "var(--font-rajdhani), sans-serif",
                                    color: accentWarm,
                                    opacity: 0.8,
                                }}
                            >
                                {event.club_name}
                            </p>

                            <div className="mb-4 flex items-start justify-between gap-4">
                                <h1
                                    className="min-w-0 flex-1 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                                    style={{
                                        fontFamily: "var(--font-cinzel), serif",
                                        background: `linear-gradient(135deg, var(--savara-cream) 0%, ${accentWarm} 100%)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    {event.event_name}
                                </h1>
                                {detailedEvent?.event_logo && (
                                    <div className="shrink-0 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-sm">
                                        <img
                                            src={detailedEvent.event_logo}
                                            alt={`${event.event_name} logo`}
                                            className="h-14 w-14 rounded-xl object-contain sm:h-20 sm:w-20"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <p
                                    className="max-w-2xl text-base italic leading-relaxed sm:text-lg"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: "rgba(245, 230, 211, 0.7)",
                                    }}
                                >
                                    {event.short_desc}
                                </p>
                            </div>
                            {teamSizeBadge && (
                                <div className="mb-5">
                                    <span
                                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            borderColor: accentSoft,
                                            color: "var(--savara-cream)",
                                            backgroundColor: "rgba(10,4,8,0.65)",
                                        }}
                                    >
                                        <Users className="h-3.5 w-3.5" /> Team Size {teamSizeBadge}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4">
                                {detailedEvent?.prizes ? (
                                    <>
                                        {[
                                            { label: "1st Place", value: detailedEvent.prizes.winner?.value },
                                            { label: "2nd Place", value: detailedEvent.prizes.runner_up?.value },
                                            { label: "3rd Place", value: detailedEvent.prizes.second_runner_up?.value },
                                        ]
                                            .filter((item) => item.value)
                                            .map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="rounded-2xl border border-white/6 bg-black/30 px-5 py-3.5 backdrop-blur-sm"
                                                >
                                                    <p
                                                        className="text-xs font-semibold uppercase tracking-[0.3em]"
                                                        style={{
                                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                                            color: "rgba(245, 230, 211, 0.5)",
                                                        }}
                                                    >
                                                        {item.label}
                                                    </p>
                                                    <p
                                                        className="text-xl font-bold sm:text-2xl"
                                                        style={{
                                                            fontFamily: "var(--font-cinzel), serif",
                                                            background: `linear-gradient(135deg, ${accent}, ${accentWarm})`,
                                                            WebkitBackgroundClip: "text",
                                                            WebkitTextFillColor: "transparent",
                                                            backgroundClip: "text",
                                                        }}
                                                    >
                                                        {item.value}
                                                    </p>
                                                </div>
                                            ))}
                                    </>
                                ) : (
                                    event.prize_pool > 0 && (
                                        <div className="rounded-2xl border border-white/6 bg-black/30 px-5 py-3.5 backdrop-blur-sm">
                                            <p
                                                className="text-xs font-semibold uppercase tracking-[0.3em]"
                                                style={{
                                                    fontFamily: "var(--font-rajdhani), sans-serif",
                                                    color: "rgba(245, 230, 211, 0.5)",
                                                }}
                                            >
                                                Prize Pool
                                            </p>
                                            <p
                                                className="text-2xl font-bold sm:text-3xl"
                                                style={{
                                                    fontFamily: "var(--font-cinzel), serif",
                                                    background: `linear-gradient(135deg, ${accent}, ${accentWarm})`,
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                    backgroundClip: "text",
                                                }}
                                            >
                                                {formatPrize(event.prize_pool)}
                                            </p>
                                        </div>
                                    )
                                )}
                                {event.date && (
                                    <div className="rounded-2xl border border-white/6 bg-black/30 px-5 py-3.5 backdrop-blur-sm">
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[0.3em]"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: "rgba(245, 230, 211, 0.5)",
                                            }}
                                        >
                                            Date
                                        </p>
                                        <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", color: "var(--savara-cream)" }}>
                                            {event.date}
                                        </p>
                                    </div>
                                )}
                                {event.venue && (
                                    <div className="rounded-2xl border border-white/6 bg-black/30 px-5 py-3.5 backdrop-blur-sm">
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[0.3em]"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: "rgba(245, 230, 211, 0.5)",
                                            }}
                                        >
                                            Venue
                                        </p>
                                        <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", color: "var(--savara-cream)" }}>
                                            {event.venue}
                                        </p>
                                    </div>
                                )}
                                {!teamSizeBadge && event.team_size && (
                                    <div className="rounded-2xl border border-white/6 bg-black/30 px-5 py-3.5 backdrop-blur-sm">
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[0.3em]"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: "rgba(245, 230, 211, 0.5)",
                                            }}
                                        >
                                            Team Size
                                        </p>
                                        <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", color: "var(--savara-cream)" }}>
                                            {event.team_size}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </section>

                <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <div className="order-2 space-y-8 md:order-1">
                        {(aboutHtml || event.full_desc) && (
                            <div>
                                <h2
                                    className="mb-3 text-base font-semibold uppercase tracking-[0.3em]"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accentWarm,
                                    }}
                                >
                                    ✦ About the Event
                                </h2>
                                {aboutHtml ? (
                                    <div
                                        className="text-base leading-[1.8] sm:text-lg [&_li]:ml-4 [&_li]:list-disc [&_li]:leading-relaxed [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:mb-4"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: "rgba(245, 230, 211, 0.85)",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: aboutHtml }}
                                    />
                                ) : (
                                    <p
                                        className="text-base leading-[1.8] sm:text-lg"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: "rgba(245, 230, 211, 0.85)",
                                        }}
                                    >
                                        {event.full_desc}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="order-1 space-y-6 md:order-2">
                        {event.highlights && event.highlights.length > 0 && (
                            <aside className="relative overflow-hidden rounded-3xl border border-white/6 bg-black/25 p-5 shadow-lg shadow-black/40 sm:p-6">
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-50"
                                    style={{
                                        background: `radial-gradient(circle at 0% 0%, ${accentSoft}, transparent 55%)`,
                                    }}
                                />
                                <div className="relative">
                                    <h2
                                        className="mb-3 text-base font-semibold uppercase tracking-[0.3em]"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: accentWarm,
                                        }}
                                    >
                                        ✦ Highlights
                                    </h2>
                                    <ul className="space-y-2.5 text-base">
                                        {event.highlights.map((item, i) => (
                                            <li
                                                key={i}
                                                className="leading-relaxed"
                                                style={{
                                                    fontFamily: "var(--font-rajdhani), sans-serif",
                                                    color: "rgba(245, 230, 211, 0.8)",
                                                }}
                                            >
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </aside>
                        )}

                        {contacts.length > 0 && (
                            <aside className="rounded-3xl border border-white/8 bg-black/30 p-5 sm:p-6">
                                <h2
                                    className="mb-4 text-sm font-semibold uppercase tracking-[0.3em]"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accentWarm,
                                    }}
                                >
                                    ✦ Contacts
                                </h2>
                                <div className="space-y-3">
                                    {contacts.map((contact, index) => (
                                        <div
                                            key={`${contact.name ?? "contact"}-${index}`}
                                            className="rounded-xl border border-white/10 bg-black/35 p-3"
                                        >
                                            <p className="font-semibold" style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}>
                                                {contact.name || "Coordinator"}
                                            </p>
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="block text-sm"
                                                    style={{ color: "rgba(245, 230, 211, 0.8)" }}
                                                >
                                                    {contact.email}
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="block text-sm"
                                                    style={{ color: "rgba(245, 230, 211, 0.8)" }}
                                                >
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        )}
                        {attachments.length > 0 && (
                            <aside className="rounded-3xl border border-white/8 bg-black/30 p-5 sm:p-6">
                                <h2
                                    className="mb-4 text-sm font-semibold uppercase tracking-[0.3em]"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accentWarm,
                                    }}
                                >
                                    ✦ Attachments
                                </h2>
                                <div className="space-y-3">
                                    {attachments.map((attachment, index) => (
                                        <div
                                            key={`${attachment.name ?? "attachment"}-${index}`}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 p-3"
                                        >
                                            <p
                                                className="min-w-0 flex-1 truncate text-sm"
                                                style={{ color: "rgba(245, 230, 211, 0.85)" }}
                                            >
                                                {attachment.name || "Attachment"}
                                            </p>
                                            {attachment.url && (
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-white/10"
                                                    style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                                                >
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        )}

                        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-black/35 p-6 text-center shadow-lg shadow-black/50 sm:p-8">
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background: `radial-gradient(circle at 50% 100%, rgba(230, 81, 0, 0.2), transparent 65%)`,
                                }}
                            />
                            <div className="relative">
                                <h3
                                    className="mb-4 text-sm font-semibold uppercase tracking-[0.35em]"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: "rgba(245, 230, 211, 0.6)",
                                    }}
                                >
                                    Registration
                                </h3>
                                {hasUnstopLink ? (
                                    <a
                                        href={event.unstop_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block w-full rounded-xl px-8 py-4 text-lg font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:scale-[1.03] hover:shadow-xl sm:text-xl"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            background: `linear-gradient(135deg, ${accent}, #b388ff)`,
                                            color: "#fff",
                                            boxShadow: `0 4px 24px ${accentSoft}`,
                                        }}
                                    >
                                        Register Now →
                                    </a>
                                ) : (
                                    <p
                                        className="text-base font-semibold sm:text-lg"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: "rgba(245, 230, 211, 0.85)",
                                        }}
                                    >
                                        On-spot event. Registration not needed!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
