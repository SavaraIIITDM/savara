import Link from "next/link";

type EventData = {
    event_type: string;
    event_name: string;
    full_desc: string;
    short_desc: string;
    club_name: string;
    prize_pool: number;
    unstop_link: string;
    rules?: string[];
    guidelines?: string[];
    highlights?: string[];
    date?: string;
    time?: string;
    venue?: string;
    team_size?: string;
    registration_fee?: string;
};

type Props = {
    event: EventData;
};

export default function TechEventDetailPage({ event }: Props) {
    const accent = "#7c4dff";
    const accentSoft = "rgba(124, 77, 255, 0.55)";
    const formatPrize = (v: number) => `₹${v.toLocaleString("en-IN")}`;

    const formatType = (t: string) => {
        if (t === "flagship") return "Flagship";
        if (t.includes("formal") && !t.includes("informal")) return "Formal";
        return "Informal";
    };

    return (
        <main
            className="min-h-screen px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-10"
            style={{
                background:
                    "radial-gradient(circle at top right, rgba(124,77,255,0.3), transparent 55%), radial-gradient(circle at bottom left, rgba(26,0,51,0.65), #05030a 70%)",
            }}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/events/technical"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] transition-colors hover:text-[var(--savara-light-gold)] sm:text-sm"
                        style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            color: "var(--savara-gold)",
                        }}
                    >
                        <span className="text-base">←</span>
                        <span>Back to Technical Events</span>
                    </Link>

                    <span
                        className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] sm:text-xs"
                        style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            backgroundColor: "rgba(10,4,8,0.75)",
                            border: `1px solid ${accentSoft}`,
                            color: accent,
                            boxShadow:
                            (event.event_type === "flagship" || event.event_type === "cult_flagship")
                              ? "0 0 16px rgba(212, 165, 116, 0.45), 0 0 30px rgba(212, 165, 116, 0.25)"
                              : "none",
                        }}
                    >
                        {formatType(event.event_type)}
                    </span>
                </div>

                {/* Hero section */}
                <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/30 p-8 sm:rounded-3xl sm:p-10 md:p-12">
                    {/* Geometric accent */}
                    <div
                        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-[120px]"
                        style={{ background: accent }}
                    />
                    <div
                        className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full opacity-20 blur-[80px]"
                        style={{ background: "rgba(124, 77, 255, 0.4)" }}
                    />

                    {/* Top accent bar */}
                    <div
                        className="absolute left-0 right-0 top-0 h-1 sm:rounded-t-3xl"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        }}
                    />

                    <div className="relative">
                        {/* Club name */}
                        <p
                            className="mb-2 text-xs font-semibold uppercase tracking-[0.4em] sm:text-sm"
                            style={{
                                fontFamily: "var(--font-rajdhani), sans-serif",
                                color: accentSoft,
                            }}
                        >
                            {event.club_name}
                        </p>

                        {/* Event name */}
                        <h1
                            className="mb-4 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                            style={{
                                fontFamily: "var(--font-cinzel), serif",
                                color: "var(--savara-cream)",
                            }}
                        >
                            {event.event_name}
                        </h1>

                        {/* Short desc as tagline */}
                        <p
                            className="mb-6 max-w-2xl text-base leading-relaxed sm:text-lg"
                            style={{
                                fontFamily: "var(--font-rajdhani), sans-serif",
                                color: "rgba(245, 230, 211, 0.7)",
                            }}
                        >
                            {event.short_desc}
                        </p>

                        {/* Quick stats row */}
                        <div className="flex flex-wrap gap-4">
                            {event.prize_pool > 0 && (
                                <div
                                    className="rounded-xl border border-white/5 bg-black/40 px-5 py-3"
                                    style={{ backdropFilter: "blur(8px)" }}
                                >
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
                                            background: `linear-gradient(135deg, ${accent}, #b388ff)`,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                        }}
                                    >
                                        {formatPrize(event.prize_pool)}
                                    </p>
                                </div>
                            )}
                            {event.date && (
                                <div
                                    className="rounded-xl border border-white/5 bg-black/40 px-5 py-3"
                                    style={{ backdropFilter: "blur(8px)" }}
                                >
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
                                <div
                                    className="rounded-xl border border-white/5 bg-black/40 px-5 py-3"
                                    style={{ backdropFilter: "blur(8px)" }}
                                >
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
                            {event.team_size && (
                                <div
                                    className="rounded-xl border border-white/5 bg-black/40 px-5 py-3"
                                    style={{ backdropFilter: "blur(8px)" }}
                                >
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
                </section>

                {/* Content grid */}
                <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    {/* Left — Description + Rules */}
                    <div className="space-y-8">
                        {/* Full description */}
                        {event.full_desc && (
                            <div>
                                <h2
                                    className="mb-3 flex items-center gap-3 text-base font-semibold uppercase tracking-[0.3em]"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accent,
                                    }}
                                >
                                    <span
                                        className="inline-block h-px w-6"
                                        style={{ background: accent }}
                                    />
                                    About the Event
                                </h2>
                                <p
                                    className="text-base leading-[1.8] sm:text-lg"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: "rgba(245, 230, 211, 0.85)",
                                    }}
                                >
                                    {event.full_desc}
                                </p>
                            </div>
                        )}

                        {/* Rules */}
                        {event.rules && event.rules.length > 0 && (
                            <div>
                                <h2
                                    className="mb-4 flex items-center gap-3 text-lg font-semibold uppercase tracking-[0.3em] sm:text-xl"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accent,
                                    }}
                                >
                                    <span
                                        className="inline-block h-px w-6"
                                        style={{ background: accent }}
                                    />
                                    Rules
                                </h2>
                                <ul className="space-y-3">
                                    {event.rules.map((rule, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-lg leading-relaxed"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: "rgba(245, 230, 211, 0.8)",
                                            }}
                                        >
                                            <span
                                                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ background: accent }}
                                            />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Guidelines */}
                        {event.guidelines && event.guidelines.length > 0 && (
                            <div>
                                <h2
                                    className="mb-4 flex items-center gap-3 text-lg font-semibold uppercase tracking-[0.3em] sm:text-xl"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accent,
                                    }}
                                >
                                    <span
                                        className="inline-block h-px w-6"
                                        style={{ background: accent }}
                                    />
                                    Guidelines
                                </h2>
                                <ul className="space-y-3">
                                    {event.guidelines.map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-lg leading-relaxed"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: "rgba(245, 230, 211, 0.78)",
                                            }}
                                        >
                                            <span
                                                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ background: accentSoft }}
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-6">
                        {/* Highlights card */}
                        {event.highlights && event.highlights.length > 0 && (
                            <aside className="relative overflow-hidden rounded-2xl border border-white/6 bg-black/25 p-5 shadow-lg shadow-black/40 sm:p-6">
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-60"
                                    style={{
                                        background: `radial-gradient(circle at 0% 0%, ${accentSoft}, transparent 55%)`,
                                    }}
                                />
                                <div className="relative">
                                    <h2
                                        className="mb-3 text-base font-semibold uppercase tracking-[0.3em]"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: accent,
                                        }}
                                    >
                                        Highlights
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

                        {/* Register CTA */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-black/35 p-6 text-center shadow-lg shadow-black/50 sm:p-8">
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background: `radial-gradient(circle at 50% 100%, ${accentSoft}, transparent 65%)`,
                                    opacity: 0.5,
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
                                <a
                                    href={event.unstop_link || "https://unstop.com"}
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
