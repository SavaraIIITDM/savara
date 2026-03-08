"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Logo3D from "@/components/Logo3D";
import HomeHeroCountdown from "@/components/HomeHeroCountdown";
import WhatIsSavara from "@/components/WhatIsSavara";
import AboutSection from "@/components/AboutSection";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

gsap.registerPlugin(ScrollTrigger);

type BackgroundMode = "hero" | "video" | "gradient";

export default function HomeStoryboard() {
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("hero");
  const [showOfferDialog, setShowOfferDialog] = useState(true);
  const footerOverlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHeroBannerMode = backgroundMode !== "video";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;

    // Only begin decoding/playing once the video phase is needed.
    if (backgroundMode === "video") {
      video.play().catch(() => {
        // Autoplay can still be blocked in some contexts.
      });
    } else {
      video.pause();
    }
  }, [backgroundMode]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "#savara",
        start: "top 50%",
        onEnter: () => setBackgroundMode("video"),
        onLeaveBack: () => setBackgroundMode("hero"),
      });

      ScrollTrigger.create({
        trigger: "#about",
        start: "top 50%",
        onEnter: () => setBackgroundMode("gradient"),
        onLeaveBack: () => setBackgroundMode("video"),
      });

      if (footerOverlayRef.current) {
        gsap.set(footerOverlayRef.current, { opacity: 0 });

        ScrollTrigger.create({
          trigger: "#footer-trigger",
          start: "top 65%",
          onEnter: () =>
            gsap.to(footerOverlayRef.current, {
              opacity: 0.5,
              duration: 0.6,
              ease: "power2.out",
            }),
          onLeaveBack: () =>
            gsap.to(footerOverlayRef.current, {
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
            }),
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {showOfferDialog && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-offer-title"
          onClick={() => setShowOfferDialog(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border bg-[rgba(42,31,26,1)] px-5 pb-5 pt-4"
            style={{ borderColor: "rgba(212, 165, 116, 0.35)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 h-8 w-8 text-lg font-bold"
              style={{ color: "rgba(245, 230, 211, 0.9)" }}
              aria-label="Close offer dialog"
              onClick={() => setShowOfferDialog(false)}
            >
              ×
            </button>
            <p
              id="home-offer-title"
              className="pr-8 text-2xl font-black uppercase"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              World Cup Final Offer!
            </p>
            <p
              className="mt-3 text-sm leading-relaxed sm:text-base"
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                color: "rgba(245, 230, 211, 0.86)",
              }}
            >
              We&apos;re giving away{" "}
              <strong>free tickets to some of the lucky winners </strong> who buy merch{" "}
              <strong>before the match ends</strong>.
            </p>
            <Link
              href="/merch"
              className="mt-5 inline-flex rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ background: "var(--savara-gold)", color: "#0a0408" }}
              onClick={() => setShowOfferDialog(false)}
            >
              Shop Merch
            </Link>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/media/hero-2560.webp"
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className={`hidden object-cover transition-opacity duration-700 sm:block ${
            isHeroBannerMode ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectPosition: "center" }}
        />

        <Image
          src="/media/hero-mobile-1170x2532.webp"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 sm:hidden ${
            isHeroBannerMode ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectPosition: "center" }}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isHeroBannerMode ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10, 4, 8, 0.1) 0%, rgba(10, 4, 8, 0.35) 70%, rgba(10, 4, 8, 0.55) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10, 4, 8, 0.2) 0%, transparent 30%, transparent 70%, rgba(10, 4, 8, 0.6) 100%)",
            }}
          />
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(230, 81, 0, 0.15) 0%, rgba(198, 40, 40, 0.08) 40%, transparent 60%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(225deg, rgba(74, 20, 140, 0.15) 0%, rgba(26, 0, 51, 0.1) 40%, transparent 60%)",
              }}
            />
          </div>
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            backgroundMode === "video" ? "opacity-100" : "opacity-0"
          }`}
          src="/background_video.mp4"
          loop
          muted
          playsInline
          preload="metadata"
          poster="/media/video-poster-1920.webp"
        />

        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            backgroundMode === "video" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(10, 4, 8, 0.34) 0%, rgba(10, 4, 8, 0.62) 75%, rgba(10, 4, 8, 0.82) 100%)",
          }}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            backgroundMode === "gradient" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.56) 45%, rgba(0, 0, 0, 0.68) 100%)",
          }}
        />

        <div
          ref={footerOverlayRef}
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.75) 100%)",
          }}
        />

        <div
          className={`absolute bottom-8 left-6 transition-opacity duration-700 sm:bottom-12 sm:left-12 ${
            backgroundMode === "hero" ? "opacity-100" : "opacity-0"
          }`}
        >
          <span
            className="text-sm font-bold uppercase tracking-[0.4em] sm:text-base md:text-lg"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--savara-gold)",
              textShadow: "0 0 20px rgba(230, 81, 0, 0.3)",
            }}
          >
            Samgatha
          </span>
        </div>

        <div
          className={`absolute bottom-8 right-6 transition-opacity duration-700 sm:bottom-12 sm:right-12 ${
            backgroundMode === "hero" ? "opacity-100" : "opacity-0"
          }`}
        >
          <span
            className="text-sm font-bold uppercase tracking-[0.4em] sm:text-base md:text-lg"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--savara-gold)",
              textShadow: "0 0 20px rgba(74, 20, 140, 0.4)",
            }}
          >
            Vashisht
          </span>
        </div>
      </div>

      <Logo3D onOpenOfferDialog={() => setShowOfferDialog(true)} />
      <HomeHeroCountdown />
      <WhatIsSavara />
      <AboutSection />
      <Sponsors />
      <div id="footer-trigger">
        <Footer />
      </div>
    </>
  );
}
