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

export default function CultEventDetailPage({ event }: Props) {
    const accent = "#e65100";
    const accentSoft = "rgba(230, 81, 0, 0.5)";
    const accentWarm = "#d4a574";
    const formatPrize = (v: number) => `₹${v.toLocaleString("en-IN")}`;

    const formatType = (t: string) => {
        if (t.includes("flagship")) return "Flagship";
        if (t.includes("formal") && !t.includes("informal")) return "Formal";
        return "Informal";
    };

    return (
        <main
            className="min-h-screen px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-10"
            style={{
                background:
                    "radial-gradient(circle at top left, rgba(230,81,0,0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(198,40,40,0.35), #0a0408 70%)",
            }}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
                {/* Top bar */}
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
                            (event.event_type === "flagship" || event.event_type === "cult_flagship")
                              ? "0 0 16px rgba(212, 165, 116, 0.45), 0 0 30px rgba(212, 165, 116, 0.25)"
                              : "none",
                        }}
                    >
                        {formatType(event.event_type)}
                    </span>
                </div>

                {/* Hero section — warm flowing style */}
                <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/20 p-8 sm:p-10 md:p-12">
                    {/* Flowing warm gradients */}
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

                    {/* Warm top accent — gradient bar */}
                    <div
                        className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accent}, ${accentWarm}, transparent)`,
                        }}
                    />

                    <div className="relative">
                        {/* Club name */}
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

                        {/* Event name — larger, warmer */}
                        <h1
                            className="mb-4 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
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

                        {/* Short desc */}
                        <p
                            className="mb-8 max-w-2xl text-base italic leading-relaxed sm:text-lg"
                            style={{
                                fontFamily: "var(--font-rajdhani), sans-serif",
                                color: "rgba(245, 230, 211, 0.7)",
                            }}
                        >
                            {event.short_desc}
                        </p>

                        {/* Stats — rounded warm cards */}
                        <div className="flex flex-wrap gap-4">
                            {event.prize_pool > 0 && (
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
                            {event.team_size && (
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
                </section>

                {/* Content grid */}
                <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    {/* Left — Description + Rules */}
                    <div className="space-y-8">
                        {/* Full description */}
                        {event.full_desc && (
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
                                    className="mb-4 text-lg font-semibold uppercase tracking-[0.3em] sm:text-xl"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accentWarm,
                                    }}
                                >
                                    ✦ Rules
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
                                                className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full"
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
                                    className="mb-4 text-lg font-semibold uppercase tracking-[0.3em] sm:text-xl"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        color: accentWarm,
                                    }}
                                >
                                    ✦ Guidelines
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
                                                className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full"
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

                        {/* Register CTA — warm style */}
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
                                <a
                                    href={event.unstop_link || "https://unstop.com"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block w-full rounded-2xl px-8 py-4 text-lg font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:scale-[1.03] hover:shadow-xl sm:text-xl"
                                    style={{
                                        fontFamily: "var(--font-rajdhani), sans-serif",
                                        background: `linear-gradient(135deg, ${accent}, ${accentWarm})`,
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
