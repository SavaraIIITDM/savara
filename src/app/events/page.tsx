"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import cultcard from "../cultcard.png";
import techcard from "../techcard.png";

type Category = {
    title: string;
    subtitle: string;
    description: string;
    href: string;
    image: any;
    objectPosition: string;
    accent: string;
    accentSoft: string;
};

const CATEGORIES: Category[] = [
    {
        title: "Cultural",
        subtitle: "Events",
        description:
            "Music, dance, drama, and art — experience the soul of Savāra through performances, showcases, and nights of celebration.",
        href: "/events/cultural",
        image: cultcard,
        objectPosition: "left center",
        accent: "#e65100",
        accentSoft: "rgba(230, 81, 0, 0.4)",
    },
    {
        title: "Technical",
        subtitle: "Events",
        description:
            "Hackathons, robotics, design, and code — from beginner-friendly contests to flagship showdowns of innovation.",
        href: "/events/technical",
        image: techcard,
        objectPosition: "right center",
        accent: "#7c4dff",
        accentSoft: "rgba(124, 77, 255, 0.4)",
    },
];

export default function EventsPage() {
    const sectionRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (headingRef.current) {
                gsap.fromTo(
                    headingRef.current,
                    { y: 24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.15 },
                );
            }

            if (subtitleRef.current) {
                gsap.fromTo(
                    subtitleRef.current,
                    { y: 16, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.3 },
                );
            }

            const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
            cards.forEach((card, index) => {
                gsap.fromTo(
                    card,
                    { y: 40, opacity: 0, scale: 0.96 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.9,
                        delay: 0.4 + index * 0.15,
                        ease: "power3.out",
                    },
                );
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={sectionRef}
            className="relative min-h-screen overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
            style={{
                background:
                    "radial-gradient(circle at top left, rgba(230,81,0,0.28), transparent 55%), radial-gradient(circle at top right, rgba(124,77,255,0.32), transparent 55%), radial-gradient(circle at bottom, rgba(10,4,8,0.95), #050307 70%)",
            }}
        >
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute -left-64 top-0 h-[640px] w-[640px] rounded-full opacity-40 blur-[220px]"
                    style={{ background: "rgba(230, 81, 0, 0.08)" }}
                />
                <div
                    className="absolute -right-64 bottom-0 h-[640px] w-[640px] rounded-full opacity-40 blur-[220px]"
                    style={{ background: "rgba(74, 20, 140, 0.08)" }}
                />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col">
                {/* Back */}
                <div className="mb-10 flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--savara-gold)] transition-colors hover:text-[var(--savara-light-gold)]"
                        style={{ fontFamily: "var(--font-rajdhani), sans-serif" }}
                    >
                        <span className="text-base">←</span>
                        <span>Back</span>
                    </Link>
                </div>

                {/* Heading */}
                <header className="mb-10 text-center sm:mb-14">
                    <h1
                        ref={headingRef}
                        className="mb-3 text-4xl font-black uppercase tracking-tight opacity-0 sm:text-5xl md:text-6xl lg:text-7xl"
                        style={{ fontFamily: "var(--font-cinzel), serif" }}
                    >
                        <span
                            style={{
                                background:
                                    "linear-gradient(135deg, #f5e6d3 0%, #f5d5a0 25%, #e65100 55%, #4a148c 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Events
                        </span>
                    </h1>
                    <p
                        ref={subtitleRef}
                        className="mx-auto max-w-xl text-xs uppercase tracking-[0.35em] opacity-0 sm:text-sm"
                        style={{
                            fontFamily: "var(--font-rajdhani), sans-serif",
                            color: "rgba(245, 230, 211, 0.55)",
                        }}
                    >
                        Choose your journey — cultural or technical
                    </p>

                    <div className="mt-6 flex justify-center">
                        <Link
                            href="/schedule"
                            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] sm:text-sm"
                            style={{
                                fontFamily: "var(--font-rajdhani), sans-serif",
                                borderColor: "rgba(212, 165, 116, 0.65)",
                                color: "var(--savara-cream)",
                                background:
                                    "linear-gradient(120deg, rgba(240, 148, 49, 0.18), rgba(74, 20, 140, 0.24))",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                            }}
                        >
                            Explore The Schedule Daywise
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </header>

                {/* Cards */}
                <section className="grid w-full grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                    {CATEGORIES.map((cat, index) => (
                        <Link key={cat.title} href={cat.href} className="group block">
                            <div
                                ref={(el) => {
                                    cardsRef.current[index] = el;
                                }}
                                className="relative overflow-hidden rounded-2xl bg-[var(--savara-stone)] shadow-xl shadow-black/40 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01] sm:rounded-3xl"
                            >
                                {/* Image with face focus */}
                                <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                                    <Image
                                        src={cat.image}
                                        alt=""
                                        fill
                                        className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
                                        style={{ objectPosition: cat.objectPosition }}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        priority={index === 0}
                                    />

                                    {/* Gradient for readability */}
                                    <div
                                        className="pointer-events-none absolute inset-0"
                                        style={{
                                            background:
                                                "linear-gradient(to top, rgba(10,4,8,0.92) 0%, rgba(10,4,8,0.55) 35%, transparent 70%)",
                                        }}
                                    />

                                    {/* Soft accent tint */}
                                    <div
                                        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light"
                                        style={{
                                            background: `radial-gradient(circle at 50% 110%, ${cat.accentSoft}, transparent 70%)`,
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-4 sm:px-8 sm:pb-7 sm:pt-5">
                                    <p
                                        className="mb-1 text-[10px] font-semibold uppercase tracking-[0.35em] sm:text-xs"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: "rgba(245, 230, 211, 0.65)",
                                        }}
                                    >
                                        {cat.subtitle}
                                    </p>
                                    <h2
                                        className="mb-1 text-2xl font-black uppercase tracking-tight text-[var(--savara-cream)] sm:text-3xl lg:text-4xl"
                                        style={{
                                            fontFamily: "var(--font-cinzel), serif",
                                            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                                        }}
                                    >
                                        {cat.title}
                                    </h2>
                                    <p
                                        className="mb-4 max-w-xs text-xs leading-relaxed sm:text-sm"
                                        style={{
                                            fontFamily: "var(--font-rajdhani), sans-serif",
                                            color: "rgba(245, 230, 211, 0.8)",
                                        }}
                                    >
                                        {cat.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] sm:text-xs transition-all duration-300 group-hover:gap-3"
                                            style={{
                                                fontFamily: "var(--font-rajdhani), sans-serif",
                                                color: cat.accent,
                                            }}
                                        >
                                            Explore
                                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                                →
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Card outline / glow */}
                                <div
                                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/3 transition-all duration-500 group-hover:ring-[1.5px] sm:rounded-3xl"
                                    style={{
                                        boxShadow: `0 0 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.65)`,
                                    }}
                                />
                                <div
                                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:rounded-3xl"
                                    style={{
                                        boxShadow: `0 0 40px ${cat.accentSoft}`,
                                    }}
                                />

                                {/* Top accent bar */}
                                <div
                                    className="absolute left-0 right-0 top-0 h-0.5 opacity-80 transition-transform duration-500 group-hover:scale-x-105 sm:rounded-t-3xl"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)`,
                                    }}
                                />
                            </div>
                        </Link>
                    ))}
                </section>
            </div>
        </main>
    );
}
