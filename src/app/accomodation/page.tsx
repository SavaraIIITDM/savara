import Image from "next/image";

const ACCOMMODATION_RULES_PDF_URL =
  "/Hostel Rules and Regulations 2025-26_UPDATED.pdf";

const accommodationRules = [
  "Bring ID card. (Need to be checked in).",
  "Show payment confirmation and ticket QR at the time of check-in.",
  "Accommodation slots are allocated only after successful payment.",
  "Rooms will be allotted on a first-come, first-served basis.",
  "Adhere to the rules according to the PDF below. Any violation may lead to cancellation of accommodation without refund.",
];

export default function AccomodationPage() {
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
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0, 0, 0, 0.55)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10, 4, 8, 0.45) 0%, rgba(10, 4, 8, 0.7) 60%, rgba(10, 4, 8, 0.82) 100%)",
          }}
        />
        <div
          className="absolute -left-32 top-10 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: "rgba(230, 81, 0, 0.12)" }}
        />
        <div
          className="absolute -right-32 bottom-10 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: "rgba(74, 20, 140, 0.18)" }}
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
          Accomodation
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
            Accommodation
          </span>
        </h1>
        <p
          className="mt-4 text-base leading-relaxed sm:text-lg"
          style={{
            fontFamily: "var(--font-rajdhani), sans-serif",
            color: "rgba(245, 230, 211, 0.75)",
          }}
        >
          Complete your accommodation booking for Savara 2027. The accommodation
          charge is INR 500 per head.
        </p>

        <section
          className="mt-8 w-full max-w-xl rounded-xl border px-5 py-6 text-left sm:px-6"
          style={{
            borderColor: "rgba(212, 165, 116, 0.25)",
            background: "rgba(42, 31, 26, 0.5)",
          }}
        >
          <h2
            className="text-xl font-bold uppercase"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            Rules & Requirements
          </h2>
          <ul
            className="mt-3 space-y-2 text-sm sm:text-base"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.85)",
            }}
          >
            {accommodationRules.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span
                  className="mt-[0.45rem] h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--savara-gold)" }}
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <a
            href={ACCOMMODATION_RULES_PDF_URL}
            download
            className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{
              background: "var(--savara-gold)",
              color: "#0a0408",
              fontFamily: "var(--font-rajdhani), sans-serif",
            }}
          >
            Download Hostel Rules PDF
          </a>
        </section>

        <section
          className="mt-8 w-full max-w-xl rounded-xl border px-5 py-6 text-left sm:px-6"
          style={{
            borderColor: "rgba(212, 165, 116, 0.25)",
            background: "rgba(42, 31, 26, 0.5)",
          }}
        >
          <h2
            className="text-xl font-bold uppercase"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            Booking Form & Payment
          </h2>
          <div
            className="mt-3 rounded-md border px-4 py-3"
            style={{
              borderColor: "rgba(212, 165, 116, 0.3)",
              background: "rgba(10, 4, 8, 0.35)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: "rgba(245, 230, 211, 0.65)",
              }}
            >
              Accommodation Price
            </p>
            <p
              className="mt-1 text-2xl font-bold uppercase"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                color: "rgba(245, 230, 211, 0.95)",
              }}
            >
              INR 500 / Head
            </p>
          </div>
          <p
            className="mt-3 text-sm sm:text-base"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.78)",
            }}
          >
            Fill out the form below to book your accommodation.
          </p>
          <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
            <a
              href="https://forms.gle/D9RPUYKbrES74x8H7"
              target="_blank"
              rel="noopener noreferrer"
              role="button"
              aria-label="Book Accommodation (opens external form in new tab)"
              className="inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
              style={{
                background: "rgba(212, 165, 116, 0.85)",
                color: "rgba(10, 4, 8, 0.9)",
                fontFamily: "var(--font-rajdhani), sans-serif",
                cursor: "pointer",
              }}
            >
              Book Accommodation
            </a>
          </div>
          <p
            className="mt-3 text-xs uppercase tracking-[0.12em]"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.62)",
            }}
          >
            Need help? Contact fest@iiitdm.ac.in
          </p>
        </section>
      </div>
    </main>
  );
}
