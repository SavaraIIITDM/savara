"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChronoCountdown from "@/components/ChronoCountdown";

export default function HomeHeroCountdown() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById("hero-countdown"));
  }, []);

  if (!container) return null;

  return createPortal(<ChronoCountdown />, container);
}
