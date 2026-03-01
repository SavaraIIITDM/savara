"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function WhatIsSavara() {
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
                threshold: 0.15,
                rootMargin: "0px 0px -50px 0px",
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="savara"
            className="defer-render relative flex min-h-screen items-center justify-center overflow-hidden"
        >
            {/* Content */}
            <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center sm:px-8 lg:px-12">

                {/* Big bold heading */}
                <h2
                    className={`mb-10 transition-all duration-1000 ease-out ${isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                        }`}
                    style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        fontSize: "clamp(3rem, 8vw, 7rem)",
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                    }}
                >
                    <span
                        style={{
                            background: "linear-gradient(90deg, #c62828, #e65100, #d84315)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        WHAT IS{" "}
                    </span>
                    <Image
                        src="/white_logo_hero.webp"
                        alt="Savāra"
                        width={512}
                        height={187}
                        priority
                        className="inline-block align-baseline"
                        style={{
                            height: "clamp(2.8rem, 7.5vw, 6.5rem)",
                            width: "auto",
                            marginLeft: "1rem",   // move right
                            transform: "translateY(1.5rem)",  // move down
                        }}
                    />
                </h2>

                {/* Description */}
                <p
                    className={`mx-auto max-w-3xl text-lg font-medium leading-relaxed text-pretty transition-all duration-1000 delay-400 ease-out sm:text-xl md:text-2xl ${isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                        }`}
                    style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        color: "rgba(245, 230, 211, 0.8)",
                    }}
                >
                    <strong style={{ color: "var(--savara-cream)" }}>SAVĀRA</strong> is
                    the new unified identity of{" "}
                    <span
                        style={{
                            background:
                                "linear-gradient(90deg, #e65100, #d4a574)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            fontWeight: 600,
                        }}
                    >
                        Samgatha × Vashisht
                    </span>{" "}
                    — the flagship techno-cultural fest of IIITDM Kancheepuram. It is the
                    collision of innovation and tradition, engineering and artistry, where
                    5,000+ minds from premier institutions ignite five days of code,
                    creativity, and culture.
                </p>

                {/* Sub-description */}
                <p
                    className={`mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-pretty transition-all duration-1000 delay-500 ease-out sm:text-lg ${isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                        }`}
                    style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        color: "rgba(245, 230, 211, 0.55)",
                    }}
                >
                    Under the banner of the theme of this year{" "}
                    <strong style={{ color: "var(--savara-gold)", fontWeight: 600 }}>Chronosync</strong>,
                    this edition transcends time itself — where the ancient meets the
                    futuristic in a spectacle unlike any other.
                </p>
            </div>
        </section>
    );
}
