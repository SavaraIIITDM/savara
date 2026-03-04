"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomeHeroAnimations() {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-hero-container]");
    const title = document.querySelector<HTMLElement>("[data-hero-title]");

    if (!container || !title) return;

    let cleanup: (() => void) | null = null;
    let idleId: ReturnType<typeof setTimeout> | number | undefined;

    const init = () => {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: 0.75,
          onUpdate: (self) => {
            gsap.set(title, { y: self.progress * 80 });
          },
        });
      });

      cleanup = () => ctx.revert();
    };

    const requestIdle = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback.bind(window)
      : null;

    const cancelIdle = typeof window.cancelIdleCallback === "function"
      ? window.cancelIdleCallback.bind(window)
      : null;

    if (requestIdle) {
      idleId = requestIdle(() => init()) as unknown as number;
    } else {
      idleId = window.setTimeout(() => init(), 0);
    }

    return () => {
      if (cancelIdle && typeof idleId === "number") {
        cancelIdle(idleId);
      } else if (idleId) {
        window.clearTimeout(idleId as number);
      }
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
