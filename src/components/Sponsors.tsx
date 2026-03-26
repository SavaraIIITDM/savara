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
      name: "Kwality Walls",
      role: "Refreshment Partner",
      logo: "/sponsors/Kwality_Wall's_idW6yaiW5D_0.png",
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
      name: "Banking Partners",
      role: "Banking Partner",
      // Pass both logos here
      logos: ["/sponsors/pnb.png", "/sponsors/iob.jpeg"], 
    },
    {
      id: 7,
      name: "Yakult",
      role: " ", // Use a space or specific text to keep alignment consistent
      logo: "/sponsors/yalkut.png",
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
  const [isVisible, setIsVisible] = useState(false);
  const [brochurePage, setBrochurePage] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
    const changeBrochurePage = (nextPage: number) => {
    if (isFlipping || nextPage < 1 || nextPage > sponsorshipBrochureTotalPages) return;
    setFlipDirection(nextPage > brochurePage ? "next" : "prev");
    setIsFlipping(true);
    setTimeout(() => setBrochurePage(nextPage), 170);
    setTimeout(() => setIsFlipping(false), 420);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="sponsors" className="relative overflow-hidden py-20 sm:py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        
        {/* Title Section */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black uppercase sm:text-6xl" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            <span style={{ background: "linear-gradient(135deg, #e65100, #c62828, #4a148c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Our</span>
            <span style={{ color: "var(--savara-cream)" }}> Sponsors</span>
          </h2>
        </div>

        <div className="mx-auto mb-14 max-w-5xl">
          <FeaturedSponsorCard sponsor={featuredSponsors.title} isVisible={isVisible} />

          {/* Partner Grid */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
            {featuredSponsors.partners.map((sponsor, index) => (
              <FeaturedPartnerCard
                key={sponsor.id}
                sponsor={sponsor as any}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>

        {/* Previous Sponsors */}
        <div className="mx-auto max-w-5xl mt-20">
          <p className="mb-8 text-center text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(245, 230, 211, 0.6)" }}>
            Previously Sponsored By
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {previousSponsors.map((sponsor, index) => (
              <LegacySponsorCard key={sponsor.id} sponsor={sponsor} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedSponsorCard({ sponsor, isVisible }: any) {
  return (
    <div className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <p className="mb-4 text-center text-xs uppercase tracking-widest" style={{ color: "rgba(245, 230, 211, 0.8)" }}>{sponsor.role}</p>
      <div className="relative h-32 w-full rounded-2xl border border-[rgba(230,81,0,0.3)] bg-black/20 backdrop-blur-sm flex items-center justify-center p-8">
        <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain p-6" />
      </div>
    </div>
  );
}

function FeaturedPartnerCard({ sponsor, index, isVisible }: any) {
  const delay = 200 + index * 80;

  return (
    <div
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.17em]"
         style={{ fontFamily: "var(--font-rajdhani), sans-serif", color: "rgba(245, 230, 211, 0.85)" }}>
        {sponsor.role}
      </p>

      <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(42,31,26,0.55)] transition-transform duration-500 hover:scale-[1.02]">
        <div className="flex h-full w-full items-center justify-center p-4 gap-3">
          {/* LOGIC: Check if logos is an array (Banking) or a single string (Yakult/Others) */}
          {sponsor.logos ? (
            sponsor.logos.map((l: string, i: number) => (
              <div key={i} className="relative h-full w-1/2">
                <Image src={l} alt="partner" fill className="object-contain transition-transform group-hover:scale-110" />
              </div>
            ))
          ) : (
            <div className="relative h-full w-full">
              <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain transition-transform group-hover:scale-110" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegacySponsorCard({ sponsor, index, isVisible }: any) {
  const delay = 450 + index * 25;
  return (
    <div className={`aspect-[4/3] relative rounded-lg border border-white/5 bg-white/5 transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: `${delay}ms` }}>
      <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain p-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
    </div>
  );
}