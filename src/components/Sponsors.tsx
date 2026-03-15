"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const featuredSponsors = {
  title: {
    id: 1,
    name: "Rikun",
    role: "Title Sponsor",
    logo: "/sponsors/rikun.jpg",
  },
  partners: [
    {
      id: 2,
      name: "Zebronics",
      role: "Sound Partner",
      logo: "/sponsors/zebronics.webp",
    },
    {
      id: 3,
      name: "Lightcast",
      role: "Events Partner",
      logo: "/sponsors/lightcast.png",
    },
    {
      id: 4,
      name: "Unstop",
      role: "Platform Partner",
      logo: "/sponsors/unstop.jpg",
    },
    {
      id: 5,
      name: "PNB",
      role: "Banking Partner",
      logo: "/sponsors/pnb.png",
    },
  ],
};

const previousSponsors = [
  { id: 1, name: "A2B", logo: "/sponsors/a2b.png" },
  { id: 2, name: "Bank of Baroda", logo: "/sponsors/bob.png" },
  { id: 3, name: "Canara Bank", logo: "/sponsors/canara_bank.png" },
  { id: 4, name: "Cigniti", logo: "/sponsors/cigniti.png" },
  { id: 5, name: "CodeChef", logo: "/sponsors/codechef.jpg" },
  { id: 6, name: "Contentstack", logo: "/sponsors/contentstack.jpg" },
  { id: 7, name: "CSK", logo: "/sponsors/csk.webp" },
  { id: 8, name: "Cyient", logo: "/sponsors/cyient.png" },
  { id: 9, name: "Devfolio", logo: "/sponsors/devfolio.webp" },
  { id: 10, name: "Green Trends", logo: "/sponsors/green_trends.webp" },
  { id: 11, name: "HDFC Bank", logo: "/sponsors/hdfc.png" },
  { id: 12, name: "Indian Bank", logo: "/sponsors/indian_bank.jpg" },
  { id: 13, name: "IOB", logo: "/sponsors/iob.jpg" },
  { id: 15, name: "MTV", logo: "/sponsors/mtv.webp" },
  { id: 16, name: "Panasonic", logo: "/sponsors/panasonic.png" },
  { id: 18, name: "SBI", logo: "/sponsors/sbi.png" },
  { id: 19, name: "The Souled Store", logo: "/sponsors/souled_store.png" },
  { id: 20, name: "TNPL", logo: "/sponsors/tnpl.jpg" },
  { id: 22, name: "VH1", logo: "/sponsors/vh1.png" },
];

const sponsorshipBrochureTotalPages = 18;
const sponsorshipBrochurePages = Array.from(
  { length: sponsorshipBrochureTotalPages },
  (_, index) =>
    `/media/sponsor-brochure/page-${String(index + 1).padStart(2, "0")}.jpg`,
);

export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const flipSwapTimerRef = useRef<number | null>(null);
  const flipSettleTimerRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [brochurePage, setBrochurePage] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  const isFirstPage = brochurePage === 1;
  const isLastPage = brochurePage === sponsorshipBrochureTotalPages;
  const currentBrochurePage = sponsorshipBrochurePages[brochurePage - 1];

  const clearFlipTimers = () => {
    if (flipSwapTimerRef.current !== null) {
      window.clearTimeout(flipSwapTimerRef.current);
      flipSwapTimerRef.current = null;
    }

    if (flipSettleTimerRef.current !== null) {
      window.clearTimeout(flipSettleTimerRef.current);
      flipSettleTimerRef.current = null;
    }
  };

  const changeBrochurePage = (nextPage: number) => {
    if (
      isFlipping ||
      nextPage < 1 ||
      nextPage > sponsorshipBrochureTotalPages ||
      nextPage === brochurePage
    ) {
      return;
    }

    clearFlipTimers();
    setFlipDirection(nextPage > brochurePage ? "next" : "prev");
    setIsFlipping(true);

    flipSwapTimerRef.current = window.setTimeout(() => {
      setBrochurePage(nextPage);
    }, 170);

    flipSettleTimerRef.current = window.setTimeout(() => {
      setIsFlipping(false);
      clearFlipTimers();
    }, 420);
  };

  useEffect(() => {
    return () => {
      if (flipSwapTimerRef.current !== null) {
        window.clearTimeout(flipSwapTimerRef.current);
      }

      if (flipSettleTimerRef.current !== null) {
        window.clearTimeout(flipSettleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const adjacentPages = [brochurePage - 1, brochurePage + 1].filter(
      (page) => page >= 1 && page <= sponsorshipBrochureTotalPages,
    );

    adjacentPages.forEach((page) => {
      const preloadImage = new window.Image();
      preloadImage.decoding = "async";
      preloadImage.src = sponsorshipBrochurePages[page - 1];
    });
  }, [brochurePage]);

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
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
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
      id="sponsors"
      className="defer-render relative overflow-hidden py-20 sm:py-32"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div
          className={`mx-auto mb-16 max-w-5xl transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div
            className="overflow-hidden rounded-[1.8rem] border"
            style={{
              borderColor: "rgba(212, 165, 116, 0.18)",
              background:
                "linear-gradient(150deg, rgba(42, 31, 26, 0.6), rgba(10, 4, 8, 0.78), rgba(24, 10, 32, 0.74))",
              boxShadow: "0 0 44px rgba(10, 4, 8, 0.26)",
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
              style={{ borderColor: "rgba(212, 165, 116, 0.12)" }}
            >
              <p
                className="text-[0.7rem] font-bold uppercase tracking-[0.22em] sm:text-xs"
                style={{
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  color: "rgba(245, 230, 211, 0.88)",
                }}
              >
                Sponsor Brochure Flipbook • Page {brochurePage} /{" "}
                {sponsorshipBrochureTotalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeBrochurePage(brochurePage - 1)}
                  disabled={isFirstPage}
                  aria-label="Go to previous brochure page"
                  className="rounded-full px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] transition-transform duration-300 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.92)",
                    border: "1px solid rgba(212, 165, 116, 0.24)",
                    background: "rgba(245, 230, 211, 0.06)",
                  }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => changeBrochurePage(brochurePage + 1)}
                  disabled={isLastPage}
                  aria-label="Go to next brochure page"
                  className="rounded-full px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] transition-transform duration-300 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    color: "rgba(245, 230, 211, 0.92)",
                    border: "1px solid rgba(212, 165, 116, 0.24)",
                    background: "rgba(245, 230, 211, 0.06)",
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="relative aspect-[3/4] overflow-hidden bg-[#10090e] sm:aspect-[16/10]">
              <div
                className="absolute inset-2 rounded-[1.2rem]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01), rgba(74, 16, 111, 0.08))",
                }}
              />

              <div
                className="absolute inset-y-5 left-1/2 z-20 w-px -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(212, 165, 116, 0), rgba(212, 165, 116, 0.4), rgba(212, 165, 116, 0))",
                }}
              />

              <div
                className="relative h-full overflow-hidden rounded-[1.1rem] border"
                style={{
                  borderColor: "rgba(212, 165, 116, 0.16)",
                  boxShadow: "inset 0 0 24px rgba(10, 4, 8, 0.35)",
                }}
              >
                <button
                  type="button"
                  onClick={() => changeBrochurePage(brochurePage - 1)}
                  disabled={isFirstPage || isFlipping}
                  aria-label="Flip to previous page"
                  className="absolute inset-y-0 left-0 z-30 w-1/4 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() => changeBrochurePage(brochurePage + 1)}
                  disabled={isLastPage || isFlipping}
                  aria-label="Flip to next page"
                  className="absolute inset-y-0 right-0 z-30 w-1/4 disabled:cursor-not-allowed"
                />

                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out"
                  style={{
                    transform: isFlipping
                      ? `perspective(1600px) rotateY(${
                          flipDirection === "next" ? -14 : 14
                        }deg) scale(0.985)`
                      : "perspective(1600px) rotateY(0deg) scale(1)",
                    transformOrigin:
                      flipDirection === "next" ? "left center" : "right center",
                  }}
                >
                  <Image
                    key={currentBrochurePage}
                    src={currentBrochurePage}
                    alt={`Sponsor brochure page ${brochurePage}`}
                    fill
                    priority={brochurePage === 1}
                    quality={82}
                    sizes="(max-width: 640px) 96vw, (max-width: 1024px) 88vw, 76vw"
                    className="object-cover select-none"
                  />

                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(10, 4, 8, 0.14), transparent 40%, rgba(10, 4, 8, 0.22) 100%)",
                    }}
                  />
                </div>

                <div
                  className={`pointer-events-none absolute inset-y-0 ${
                    flipDirection === "next" ? "right-0" : "left-0"
                  } w-12 transition-opacity duration-300`}
                  style={{
                    opacity: isFlipping ? 0.9 : 0.35,
                    background:
                      flipDirection === "next"
                        ? "linear-gradient(to left, rgba(212, 165, 116, 0.22), rgba(212, 165, 116, 0.04), transparent)"
                        : "linear-gradient(to right, rgba(212, 165, 116, 0.22), rgba(212, 165, 116, 0.04), transparent)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2
            className={`text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, #e65100, #c62828, #4a148c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Our
            </span>{" "}
            <span style={{ color: "var(--savara-cream)" }}>Sponsors</span>
          </h2>
          <p
            className={`mx-auto mt-4 max-w-2xl font-medium transition-all duration-1000 delay-200 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.9)",
            }}
          >
            Proudly supported by industry leaders
          </p>
        </div>

        <div className="mx-auto mb-14 max-w-5xl">
          <FeaturedSponsorCard
            sponsor={featuredSponsors.title}
            isVisible={isVisible}
          />

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
            {featuredSponsors.partners.map((sponsor, index) => (
              <FeaturedPartnerCard
                key={sponsor.id}
                sponsor={sponsor}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <p
            className={`mb-5 text-center text-xs uppercase tracking-[0.22em] transition-all duration-700 ${
              isVisible ? "opacity-75" : "opacity-0"
            }`}
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              color: "rgba(245, 230, 211, 0.75)",
            }}
          >
            Previously Sponsored By
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {previousSponsors.map((sponsor, index) => (
              <LegacySponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top decorative line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(74, 20, 140, 0.4), rgba(230, 81, 0, 0.4), transparent)",
        }}
      />
    </section>
  );
}

function FeaturedSponsorCard({
  sponsor,
  isVisible,
}: {
  sponsor: { id: number; name: string; role: string; logo: string };
  isVisible: boolean;
}) {
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <p
        className="mb-3 text-center text-xs uppercase tracking-[0.2em] sm:text-sm"
        style={{
          fontFamily: "var(--font-rajdhani), sans-serif",
          color: "rgba(245, 230, 211, 0.88)",
        }}
      >
        {sponsor.role}
      </p>

      <div
        className="group relative overflow-hidden rounded-2xl backdrop-blur-sm transition-transform duration-700 ease-out hover:scale-[1.01]"
        style={{
          border: "1px solid rgba(230, 81, 0, 0.35)",
          background:
            "linear-gradient(160deg, rgba(230, 81, 0, 0.15), rgba(74, 20, 140, 0.12), rgba(42, 31, 26, 0.45))",
          boxShadow: "0 0 40px rgba(230, 81, 0, 0.18)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center px-6 py-8 sm:px-10 sm:py-10">
          <div className="relative h-24 w-full sm:h-28 md:h-32">
            <Image
              src={sponsor.logo}
              alt={`${sponsor.name} logo`}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 60vw"
            />
          </div>
        </div>

        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at center, rgba(245, 230, 211, 0.08), transparent 65%)",
          }}
        />
      </div>
    </div>
  );
}

function FeaturedPartnerCard({
  sponsor,
  index,
  isVisible,
}: {
  sponsor: { id: number; name: string; role: string; logo: string };
  index: number;
  isVisible: boolean;
}) {
  const delay = 200 + index * 80;

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      <p
        className="mb-2 text-center text-[10px] uppercase tracking-[0.17em] sm:text-[11px]"
        style={{
          fontFamily: "var(--font-rajdhani), sans-serif",
          color: "rgba(245, 230, 211, 0.85)",
        }}
      >
        {sponsor.role}
      </p>

      <div
        className="group relative aspect-[16/10] overflow-hidden rounded-xl transition-transform duration-700 ease-out hover:scale-[1.02]"
        style={{
          border: "1px solid rgba(212, 165, 116, 0.2)",
          background: "rgba(42, 31, 26, 0.55)",
        }}
      >
        <div className="relative h-full w-full p-4 sm:p-5">
          <Image
            src={sponsor.logo}
            alt={`${sponsor.name} logo`}
            fill
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>

        <div
          className="absolute inset-0 -translate-x-full skew-x-12 transition-transform duration-700 group-hover:translate-x-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(212, 165, 116, 0.06), transparent)",
          }}
        />
      </div>
    </div>
  );
}

function LegacySponsorCard({
  sponsor,
  index,
  isVisible,
}: {
  sponsor: { id: number; name: string; logo: string };
  index: number;
  isVisible: boolean;
}) {
  const delay = 450 + index * 25;

  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-lg transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        border: "1px solid rgba(212, 165, 116, 0.08)",
        background: "rgba(42, 31, 26, 0.25)",
      }}
    >
      <div className="relative h-full w-full p-2.5 sm:p-3">
        <Image
          src={sponsor.logo}
          alt={`${sponsor.name} logo`}
          fill
          className="object-contain p-2 opacity-80"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
        />
      </div>
    </div>
  );
}
