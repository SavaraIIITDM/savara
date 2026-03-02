"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ChronoCountdown from "./ChronoCountdown";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export default function Logo3D() {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const spiralRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const particleCount = useMemo(() => (isMobile ? 10 : 20), [isMobile]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updateDeviceMode = () => setIsMobile(mediaQuery.matches);

    updateDeviceMode();
    mediaQuery.addEventListener("change", updateDeviceMode);
    return () => mediaQuery.removeEventListener("change", updateDeviceMode);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Spiral rotation
      if (!isMobile) {
        gsap.to(spiralRef.current, {
          rotation: 360,
          duration: 20,
          repeat: -1,
          ease: "none",
        });
      }

      // Floating particles
      if (!isMobile && particlesRef.current) {
        const particles = particlesRef.current.children;
        Array.from(particles).forEach((particle, i) => {
          gsap.to(particle, {
            y: gsap.utils.random(-30, 30),
            x: gsap.utils.random(-20, 20),
            opacity: gsap.utils.random(0.2, 0.8),
            duration: gsap.utils.random(3, 6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.3,
          });
        });
      }

      // Parallax on scroll
      if (!isMobile) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.75,
          onUpdate: (self) => {
            if (titleRef.current) {
              gsap.set(titleRef.current, { y: self.progress * 80 });
            }
          },
        });
      }
    });

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated glow orbs */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full -left-48 top-1/4"
            style={{
              background:
                "radial-gradient(circle, rgba(230, 81, 0, 0.15) 0%, transparent 70%)",
              animation: "pulse-glow 4s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full -right-48 top-1/4"
            style={{
              background:
                "radial-gradient(circle, rgba(74, 20, 140, 0.2) 0%, transparent 70%)",
              animation: "pulse-glow 4s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full left-1/2 bottom-0 -translate-x-1/2"
            style={{
              background:
                "radial-gradient(circle, rgba(212, 165, 116, 0.15) 0%, transparent 70%)",
              animation: "pulse-glow 3s ease-in-out infinite 1s",
            }}
          />
        </div>
      )}

      {/* Spiral decorative element (center-top) */}
      <div
        ref={spiralRef}
        className={`absolute top-[15%] left-1/2 -translate-x-1/2 w-40 h-40 sm:w-56 sm:h-56 opacity-10 pointer-events-none ${
          isMobile ? "hidden" : ""
        }`}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M100 20 C140 20, 180 60, 180 100 C180 140, 140 180, 100 180 C60 180, 30 150, 30 110 C30 80, 55 55, 80 55 C105 55, 125 75, 125 100 C125 120, 110 135, 90 135 C75 135, 65 120, 65 105 C65 90, 78 80, 90 80"
            fill="none"
            stroke="url(#spiralGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="spiralGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#e65100" />
              <stop offset="100%" stopColor="#4a148c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating particles — deterministic positions to avoid hydration mismatch */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = (((i * 13 + 5) % 10) / 10) * 4 + 2;
          const left = ((i * 17 + 3) % 20) * 5;
          const top = ((i * 11 + 7) % 20) * 5;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                top: `${top}%`,
                background:
                  i % 2 === 0
                    ? "rgba(230, 81, 0, 0.5)"
                    : "rgba(74, 20, 140, 0.5)",
                opacity: 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Main Content: logo + countdown move together */}
      <div
        ref={titleRef}
        className="relative z-10 flex flex-col items-center justify-center px-4 text-center"
      >
        {/* Main Wordmark: SAVĀRA CHRONOSYNC */}
        <div className="mb-4">
          <Image
            src="/white_logo_hero.webp"
            alt="SAVĀRA Chronosync"
            width={1200}
            height={480}
            priority
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 62vw, 56vw"
            className="h-24 w-auto sm:h-32 md:h-40 lg:h-52 xl:h-64"
            style={{
              filter: "drop-shadow(0 0 40px rgba(230, 81, 0, 0.3))",
            }}
          />
        </div>
        <ChronoCountdown />
      </div>

    </div>
  );
}
