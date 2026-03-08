import Image from "next/image";
import Link from "next/link";

export default function HomeHeroStatic() {
  return (
    <section
      data-hero-container
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <div
        data-hero-title
        className="relative z-10 flex flex-col items-center justify-center px-4 text-center"
      >
        <Link
          href="/tickets"
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs"
          style={{
            fontFamily: "var(--font-rajdhani), sans-serif",
            borderColor: "rgba(212, 165, 116, 0.45)",
            background: "rgba(42, 31, 26, 0.64)",
            color: "rgba(245, 230, 211, 0.92)",
          }}
        >
          <span className="inline-block h-2 w-2 rounded-full animate-[pulse_1.6s_ease-in-out_infinite]" style={{ background: "#f09431" }} />
          <span>Early bird offer live . get tickets now -&gt;</span>
        </Link>
        <div className="mb-4">
          <Image
            src="/white_logo_hero.webp"
            alt="SAVĀRA Chronosync"
            width={1200}
            height={480}
            priority
            fetchPriority="high"
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 62vw, 56vw"
            className="h-24 w-auto sm:h-32 md:h-40 lg:h-52 xl:h-64"
            style={{
              filter: "drop-shadow(0 0 40px rgba(230, 81, 0, 0.3))",
            }}
          />
        </div>
        <div
          id="hero-countdown"
          className="mt-4 flex w-full items-center justify-center"
          style={{ minHeight: "2.25rem" }}
        />
      </div>
    </section>
  );
}
