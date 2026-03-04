import Image from "next/image";

export default function TicketsPage() {
  return (
    <main className="relative min-h-screen px-6 pb-20 pt-28 sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/media/hero-2560.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.55)" }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10, 4, 8, 0.45) 0%, rgba(10, 4, 8, 0.7) 60%, rgba(10, 4, 8, 0.82) 100%)",
          }}
        />
        <div
          className="absolute -left-24 top-12 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: "rgba(230, 81, 0, 0.14)" }}
        />
        <div
          className="absolute -right-24 bottom-12 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: "rgba(74, 20, 140, 0.16)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <p
          className="text-xs font-semibold uppercase tracking-[0.35em]"
          style={{
            fontFamily: "var(--font-rajdhani), sans-serif",
            color: "rgba(245, 230, 211, 0.6)",
          }}
        >
          Tickets
        </p>
        <h1
          className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          <span
            style={{
              background:
                "linear-gradient(135deg, #f5e6d3 0%, #f5d5a0 35%, #e65100 60%, #4a148c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Coming Soon
          </span>
        </h1>
        <p
          className="mt-4 text-base leading-relaxed sm:text-lg"
          style={{
            fontFamily: "var(--font-rajdhani), sans-serif",
            color: "rgba(245, 230, 211, 0.75)",
          }}
        >
          Ticket drops, passes, and pricing will be announced shortly.
        </p>
      </div>
    </main>
  );
}
