"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Instagram, Linkedin, Youtube } from "lucide-react";

interface MenuItemProps {
  label: string;
  index: number;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

function MenuItem({ label, index, isOpen, isMobile, onClose }: MenuItemProps) {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!itemRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        itemRef.current,
        {
          x: isMobile ? 24 : 60,
          opacity: 0,
          rotateX: isMobile ? 0 : -90,
        },
        {
          x: 0,
          opacity: 1,
          rotateX: 0,
          duration: isMobile ? 0.35 : 0.8,
          delay: isMobile ? 0.08 + index * 0.04 : 0.3 + index * 0.08,
          ease: isMobile ? "power2.out" : "power4.out",
        },
      );
    }
  }, [isOpen, index, isMobile]);

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (!itemRef.current) return;

    letterRefs.current.forEach((letter) => {
      if (letter) gsap.killTweensOf(letter);
    });

    gsap.to(itemRef.current, {
      x: 20,
      scale: 1.05,
      duration: 0.4,
      ease: "power3.out",
    });

    letterRefs.current.forEach((letter, i) => {
      if (!letter) return;
      gsap.to(letter, {
        y: -6,
        rotateZ: gsap.utils.random(-10, 10),
        color: "#e65100",
        textShadow: "0 0 20px rgba(230, 81, 0, 0.5)",
        duration: 0.3,
        delay: i * 0.03,
        ease: "power2.out",
      });

      gsap.to(letter, {
        y: 0,
        rotateZ: 0,
        duration: 0.4,
        delay: 0.3 + i * 0.03,
        ease: "elastic.out(1, 0.5)",
      });
    });

    const glitchTl = gsap.timeline();
    glitchTl
      .to(itemRef.current, {
        skewX: 5,
        duration: 0.1,
      })
      .to(itemRef.current, {
        skewX: -3,
        duration: 0.1,
      })
      .to(itemRef.current, {
        skewX: 0,
        duration: 0.1,
      });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (!itemRef.current) return;

    gsap.killTweensOf(itemRef.current);
    letterRefs.current.forEach((letter) => {
      if (letter) gsap.killTweensOf(letter);
    });

    gsap.to(itemRef.current, {
      x: 0,
      scale: 1,
      skewX: 0,
      duration: 0.3,
      ease: "power3.out",
      overwrite: true,
    });

    letterRefs.current.forEach((letter) => {
      if (!letter) return;
      gsap.to(letter, {
        y: 0,
        rotateZ: 0,
        color: "#f5e6d3",
        textShadow: "none",
        duration: 0.2,
        ease: "power2.out",
        overwrite: true,
      });
    });
  };

  const handleClick = () => {
    onClose();
  };

  const hrefMap: Record<string, string> = {
    Home: "/",
    About: "/#about",
    Events: "/events",
    Accomodation: "/accomodation",
    Tickets: "/tickets",
    Merch: "/merch",
    Sponsors: "/#sponsors",
    Contact: "/#contact",
  };

  return (
    <a
      ref={itemRef}
      href={hrefMap[label] ?? `#${label.toLowerCase()}`}
      className="group relative block cursor-pointer py-2 opacity-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      <span
        className="relative inline-flex text-2xl font-black uppercase tracking-tight sm:text-3xl md:text-4xl"
        style={{ color: "var(--savara-cream)", fontFamily: "var(--font-cinzel), serif" }}
      >
        {label.split("").map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className="inline-block"
            style={{ display: char === " " ? "inline" : "inline-block" }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
      {/* Decorative line */}
      <span
        className="absolute -bottom-1 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full"
        style={{
          background: "linear-gradient(to right, #e65100, #c62828, #4a148c)",
        }}
      />
    </a>
  );
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = ["Home", "About", "Events", "Accomodation", "Tickets", "Merch", "Sponsors", "Contact"];
  const socialLinks = [
    { href: "https://www.instagram.com/savara.iiitdm/", Icon: Instagram, label: "Instagram" },
    { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
    { href: "https://youtube.com", Icon: Youtube, label: "YouTube" },
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updateDeviceMode = () => setIsMobile(mediaQuery.matches);

    updateDeviceMode();
    mediaQuery.addEventListener("change", updateDeviceMode);
    return () => mediaQuery.removeEventListener("change", updateDeviceMode);
  }, []);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    gsap.killTweensOf([backdropRef.current, panelRef.current]);

    if (isOpen) {
      // Fade in backdrop
      gsap.to(backdropRef.current, {
        opacity: 1,
        duration: isMobile ? 0.2 : 0.35,
        ease: "power2.out",
      });

      // Slide panel in from right
      gsap.to(panelRef.current, {
        x: 0,
        duration: isMobile ? 0.28 : 0.5,
        ease: isMobile ? "power2.out" : "power4.out",
      });
    } else {
      // Fade out backdrop
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: isMobile ? 0.16 : 0.24,
        ease: "power2.in",
      });

      // Slide panel out to right
      gsap.to(panelRef.current, {
        x: "100%",
        duration: isMobile ? 0.22 : 0.34,
        ease: isMobile ? "power2.in" : "power4.in",
      });
    }
  }, [isOpen, isMobile]);

  return (
    <>
      {/* Semi-transparent backdrop — click to close */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-100"
        style={{
          background: "rgba(10, 4, 8, 0.6)",
          backdropFilter: isMobile ? "none" : "blur(4px)",
          opacity: 0,
          pointerEvents: isOpen ? "auto" : "none",
          willChange: "opacity",
        }}
        onClick={onClose}
      />

      {/* Slide-in panel (right side, ~50% width) */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 z-101 flex h-full w-full flex-col justify-center overflow-hidden px-8 sm:w-[55%] md:w-[45%] lg:w-[40%] sm:px-12"
        style={{
          transform: "translateX(100%)",
          background: "linear-gradient(135deg, #0a0408 0%, #1a0a04 30%, #0d0520 70%, #0a0408 100%)",
          borderLeft: "1px solid rgba(212, 165, 116, 0.1)",
          boxShadow: "-20px 0 60px rgba(0, 0, 0, 0.5)",
          willChange: "transform",
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="absolute -left-1/4 top-1/4 h-72 w-72 rounded-full blur-[120px]"
            style={{ background: "var(--savara-orange)" }}
          />
          <div
            className="absolute -right-1/4 bottom-1/4 h-72 w-72 rounded-full blur-[120px]"
            style={{ background: "var(--savara-purple)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
            style={{ background: "var(--savara-deep-red)" }}
          />
        </div>

        {/* Stone texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent, rgba(230, 81, 0, 0.5), rgba(74, 20, 140, 0.5), transparent)",
          }}
        />

        {/* Menu Items + Social rail */}
        <div className="relative z-10 flex items-center justify-between gap-10 sm:gap-14">
          <nav className="flex max-w-[75%] flex-col gap-3 md:gap-4">
            {menuItems.map((item, index) => (
              <MenuItem
                key={item}
                label={item}
                index={index}
                isOpen={isOpen}
                isMobile={isMobile}
                onClose={onClose}
              />
            ))}
          </nav>

          <div className="flex flex-col items-center justify-center gap-6">
            {socialLinks.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="opacity-80 transition-all duration-300 hover:scale-110 hover:opacity-100"
                style={{ color: "var(--savara-cream)" }}
              >
                <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
              </a>
            ))}
          </div>
        </div>

        {/* Decorative number */}
        <div
          className="absolute bottom-6 right-6 text-[15vw] sm:text-[10vw] font-black leading-none pointer-events-none"
          style={{
            fontFamily: "var(--font-cinzel), serif",
            color: "rgba(212, 165, 116, 0.04)",
          }}
        >
          26
        </div>

        {/* Bottom decorative line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent, rgba(230, 81, 0, 0.4), rgba(74, 20, 140, 0.4), transparent)",
          }}
        />
      </div>
    </>
  );
}
