"use client";

import { useEffect, useRef, useState } from "react";

const routeSteps = [
  {
    step: "01",
    mode: "Walk",
    duration: "10 min",
    title: "Chennai Central to Park Station",
    description:
      "Walk from Chennai Central to Park, the nearby suburban station for Tambaram-bound trains.",
    note: "This is the quickest handoff from the main terminal into the suburban network.",
  },
  {
    step: "02",
    mode: "Suburban Rail",
    duration: "45 min",
    title: "Board a Tambaram-bound train",
    description:
      "Catch the Chennai Suburban Railway service from Park and ride directly to Tambaram.",
    note: "The official IIITDM directions page lists this as the main public-transport route from Central.",
  },
  {
    step: "03",
    mode: "Bus",
    duration: "10 km",
    title: "Tambaram to Kandigai",
    description:
      "From Tambaram bus terminus, board a bus toward Kandigai. Common options include 515, 517, 519, 555, 115, 55K, and 55D.",
    note: "Bus 55D is the direct bus to IIITDM and typically runs about once every hour.",
  },
  {
    step: "04",
    mode: "Last Mile",
    duration: "1.5 km",
    title: "Kandigai to campus",
    description:
      "Get down at Kandigai, then walk the final stretch to IIITDM or take a short auto ride.",
    note: "The official directions mention an auto fare of roughly Rs. 50 from Kandigai.",
  },
] as const;

const travelFacts = [
  {
    label: "tambaram to kandigai bus options",
    value: "55 515",
  },
  {
    label: "Nearest stop",
    value: "Kandigai",
  },
  {
    label: "Campus location",
    value: "Melakottaiyur, off Vandalur-Kelambakkam Road",
  },
] as const;

const officialDirectionsUrl =
  "https://iiitdm.ac.in/maps-and-directions/from-central";
const googleDirectionsUrl =
  "https://www.google.com/maps/dir/?api=1&origin=Chennai+Central+Railway+Station&destination=IIITDM+Kancheepuram&travelmode=transit";
const campusMapUrl =
  "https://www.google.com/maps/search/?api=1&query=IIITDM+Kancheepuram";
const campusMapEmbedUrl =
  "https://maps.google.com/maps?q=IIITDM%20Kancheepuram&t=&z=14&ie=UTF8&iwloc=&output=embed";

export default function ReachCampusSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="directions"
      className="defer-render relative overflow-hidden py-20 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl sm:h-72 sm:w-72"
          style={{ background: "rgba(209, 29, 29, 0.16)" }}
        />
        <div
          className="absolute -left-16 top-32 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64"
          style={{ background: "rgba(240, 148, 49, 0.12)" }}
        />
        <div
          className="absolute -right-16 bottom-10 h-56 w-56 rounded-full blur-3xl sm:h-72 sm:w-72"
          style={{ background: "rgba(74, 16, 111, 0.2)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div
          className={`max-w-3xl transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p
            className="text-[0.7rem] font-bold uppercase tracking-[0.3em] sm:text-xs"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(212, 165, 116, 0.88)",
            }}
          >
            Campus Route
          </p>

          <h2
            className="mt-5 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl md:text-[3.7rem] lg:text-[4.3rem]"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, #d11d1d, #f09431, #4a106f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              From Chennai Central
            </span>{" "}
            <span style={{ color: "var(--savara-cream)" }}>to IIITDM</span>
          </h2>

          <p
            className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-pretty sm:text-lg"
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.82)",
            }}
          >
            The cleanest public-transport route runs from Chennai Central to
            Park, then Tambaram, Kandigai, and finally IIITDM. We combined the
            official IIITDM directions pages into one quick reference so
            visitors can plan the trip without switching tabs.
          </p>
        </div>

        <div className="mt-14 grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div
            className={`rounded-[2rem] border p-6 backdrop-blur-sm transition-all duration-1000 ease-out sm:p-8 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{
              borderColor: "rgba(212, 165, 116, 0.2)",
              background:
                "linear-gradient(160deg, rgba(42, 31, 26, 0.5), rgba(10, 4, 8, 0.72), rgba(24, 10, 32, 0.7))",
              boxShadow: "0 0 44px rgba(10, 4, 8, 0.22)",
            }}
          >
            <div className="relative space-y-5 sm:space-y-6">
              <div
                className="absolute bottom-6 left-[1.05rem] top-6 w-px sm:left-[1.18rem]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(240, 148, 49, 0.7), rgba(74, 16, 111, 0.45), rgba(209, 29, 29, 0.2))",
                }}
              />

              {routeSteps.map((routeStep, index) => (
                <article
                  key={routeStep.step}
                  className={`relative rounded-[1.6rem] border px-5 py-5 pl-14 transition-all duration-700 ease-out sm:px-6 sm:py-6 sm:pl-16 ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${index * 130}ms`,
                    borderColor: "rgba(212, 165, 116, 0.14)",
                    background:
                      "linear-gradient(150deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))",
                  }}
                >
                  <div
                    className="absolute left-0 top-6 flex h-9 w-9 items-center justify-center rounded-full border text-[0.72rem] font-bold tracking-[0.18em] sm:left-1 sm:h-10 sm:w-10"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "var(--savara-cream)",
                      borderColor: "rgba(212, 165, 116, 0.34)",
                      background:
                        "linear-gradient(135deg, rgba(209, 29, 29, 0.8), rgba(240, 148, 49, 0.75), rgba(74, 16, 111, 0.8))",
                      boxShadow: "0 0 16px rgba(240, 148, 49, 0.2)",
                    }}
                  >
                    {routeStep.step}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="text-[0.72rem] font-bold uppercase tracking-[0.22em]"
                      style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        color: "rgba(240, 148, 49, 0.9)",
                      }}
                    >
                      {routeStep.mode}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
                      style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        color: "rgba(245, 230, 211, 0.92)",
                        background: "rgba(245, 230, 211, 0.08)",
                        border: "1px solid rgba(245, 230, 211, 0.1)",
                      }}
                    >
                      {routeStep.duration}
                    </span>
                  </div>

                  <h3
                    className="mt-3 text-lg font-semibold uppercase tracking-[0.16em] sm:text-xl"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "var(--savara-cream)",
                    }}
                  >
                    {routeStep.title}
                  </h3>

                  <p
                    className="mt-3 text-sm font-medium leading-relaxed sm:text-base"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.78)",
                    }}
                  >
                    {routeStep.description}
                  </p>

                  <p
                    className="mt-2.5 text-xs font-medium leading-relaxed sm:text-sm"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(212, 165, 116, 0.82)",
                    }}
                  >
                    {routeStep.note}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {travelFacts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={`rounded-[1.4rem] border px-5 py-4 transition-all duration-700 ease-out ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${index * 120 + 220}ms`,
                    borderColor: "rgba(212, 165, 116, 0.14)",
                    background: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <p
                    className="text-[0.72rem] font-bold uppercase tracking-[0.24em]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(240, 148, 49, 0.88)",
                    }}
                  >
                    {fact.label}
                  </p>
                  <p
                    className="mt-3 text-sm font-medium leading-relaxed sm:text-[0.95rem]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.88)",
                    }}
                  >
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div
              className={`overflow-hidden rounded-[2rem] border backdrop-blur-sm transition-all duration-1000 delay-150 ease-out ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{
                borderColor: "rgba(212, 165, 116, 0.2)",
                background:
                  "linear-gradient(150deg, rgba(42, 31, 26, 0.54), rgba(10, 4, 8, 0.78), rgba(24, 10, 32, 0.74))",
                boxShadow: "0 0 44px rgba(74, 16, 111, 0.12)",
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 sm:px-6"
                style={{ borderColor: "rgba(212, 165, 116, 0.12)" }}
              >
                <div>
                  <p
                    className="text-[0.72rem] font-bold uppercase tracking-[0.26em]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(240, 148, 49, 0.9)",
                    }}
                  >
                    Interactive Map
                  </p>
                  <h3
                    className="mt-2 text-lg font-semibold uppercase tracking-[0.16em] sm:text-xl"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "var(--savara-cream)",
                    }}
                  >
                    Locate the Campus
                  </h3>
                </div>

                <span
                  className="rounded-full px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.22em]"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.88)",
                    background: "rgba(245, 230, 211, 0.08)",
                    border: "1px solid rgba(245, 230, 211, 0.12)",
                  }}
                >
                  Melakottaiyur
                </span>
              </div>

              <div className="aspect-[4/5] sm:aspect-[16/11]">
                <iframe
                  title="IIITDM Kancheepuram campus map"
                  src={campusMapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              </div>

              <div
                className="grid gap-3 border-t p-5 sm:grid-cols-2 sm:p-6"
                style={{ borderColor: "rgba(212, 165, 116, 0.12)" }}
              >
                <a
                  href={googleDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center rounded-full p-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, #d11d1d, #f09431, #4a106f)",
                  }}
                >
                  <span
                    className="w-full rounded-full px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.22em] transition-all duration-300 group-hover:bg-transparent"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "var(--savara-cream)",
                      background: "rgba(10, 4, 8, 0.92)",
                    }}
                  >
                    Open Google Maps
                  </span>
                </a>

                <a
                  href={officialDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.92)",
                    border: "1px solid rgba(212, 165, 116, 0.24)",
                    background: "rgba(245, 230, 211, 0.04)",
                  }}
                >
                  Official Directions
                </a>
              </div>
            </div>

            <div
              className={`rounded-[2rem] border p-5 transition-all duration-1000 delay-300 ease-out sm:p-6 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{
                borderColor: "rgba(212, 165, 116, 0.18)",
                background:
                  "linear-gradient(150deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))",
              }}
            >
              <p
                className="text-[0.72rem] font-bold uppercase tracking-[0.24em]"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  color: "rgba(240, 148, 49, 0.9)",
                }}
              >
                Quick Checkpoints
              </p>

              <div className="mt-4 space-y-3">
                <div
                  className="rounded-[1.3rem] border px-4 py-3"
                  style={{
                    borderColor: "rgba(212, 165, 116, 0.12)",
                    background: "rgba(10, 4, 8, 0.28)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-[0.2em]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.64)",
                    }}
                  >
                    From Tambaram
                  </p>
                  <p
                    className="mt-2 text-sm font-medium leading-relaxed sm:text-[0.95rem]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.88)",
                    }}
                  >
                    Head to the bus terminus beside the railway station and look
                    for Kandigai or IIITDM-bound buses.
                  </p>
                </div>

                <div
                  className="rounded-[1.3rem] border px-4 py-3"
                  style={{
                    borderColor: "rgba(212, 165, 116, 0.12)",
                    background: "rgba(10, 4, 8, 0.28)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-[0.2em]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.64)",
                    }}
                  >
                    Last mile
                  </p>
                  <p
                    className="mt-2 text-sm font-medium leading-relaxed sm:text-[0.95rem]"
                    style={{
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      color: "rgba(245, 230, 211, 0.88)",
                    }}
                  >
                    If you get down at Kandigai, the campus is about 1.5 km
                    away. Walk in if the weather is fine, or take an auto for a
                    short final hop.
                  </p>
                </div>

                <a
                  href={campusMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.92)",
                    border: "1px solid rgba(212, 165, 116, 0.22)",
                    background:
                      "linear-gradient(135deg, rgba(240, 148, 49, 0.14), rgba(74, 16, 111, 0.14))",
                  }}
                >
                  Open Campus Pin
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(74, 20, 140, 0.4), rgba(240, 148, 49, 0.4), transparent)",
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(240, 148, 49, 0.28), rgba(209, 29, 29, 0.28), transparent)",
        }}
      />
    </section>
  );
}
