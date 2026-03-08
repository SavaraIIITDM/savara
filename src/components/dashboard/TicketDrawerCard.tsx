"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";

type PerkItem = {
  perk_id: string;
  perk_name: string;
  attended: boolean;
};

type TicketDrawerCardProps = {
  displayName: string;
  participantType: "internal" | "external";
  qrDataUrl: string;
  perks: PerkItem[];
};

const PEEK_HEIGHT = 86;
const VERTICAL_THRESHOLD = 0.4;
const FLIP_THRESHOLD = 0.5;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function animateTo({
  from,
  to,
  duration,
  onFrame,
  onComplete,
}: {
  from: number;
  to: number;
  duration: number;
  onFrame: (value: number) => void;
  onComplete?: () => void;
}) {
  if (typeof window === "undefined") {
    onFrame(to);
    onComplete?.();
    return;
  }

  const start = window.performance.now();

  const tick = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);
    onFrame(from + (to - from) * eased);

    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    onComplete?.();
  };

  window.requestAnimationFrame(tick);
}

export function TicketDrawerCard({ displayName, participantType, qrDataUrl, perks }: TicketDrawerCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragAxisRef = useRef<"none" | "vertical" | "horizontal">("none");
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const drawerStartRef = useRef(0);
  const flipStartRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const [cardHeight, setCardHeight] = useState(620);
  const [drawerY, setDrawerY] = useState(0);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isAnimatingDrawer, setIsAnimatingDrawer] = useState(false);
  const [isAnimatingFlip, setIsAnimatingFlip] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const hiddenHeight = Math.max(0, cardHeight - PEEK_HEIGHT);
  const isOpen = drawerY <= 1;
  const openRatio = hiddenHeight === 0 ? 1 : 1 - drawerY / hiddenHeight;

  useEffect(() => {
    const recalc = () => {
      const nextHeight = Math.round(Math.min(window.innerHeight * 0.82, 700));
      const nextHidden = Math.max(0, nextHeight - PEEK_HEIGHT);
      setCardHeight(nextHeight);
      setDrawerY((current) => {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          return nextHidden;
        }

        if (current <= 1) {
          return 0;
        }
        return nextHidden;
      });
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const ticketTypeLabel = participantType.toUpperCase();
  const showPerks = participantType === "internal";
  const visiblePerks = useMemo(() => (showPerks ? perks : []), [perks, showPerks]);

  const snapDrawer = (targetOpen: boolean) => {
    setIsAnimatingDrawer(true);
    animateTo({
      from: drawerY,
      to: targetOpen ? 0 : hiddenHeight,
      duration: 380,
      onFrame: (value) => setDrawerY(value),
      onComplete: () => setIsAnimatingDrawer(false),
    });
  };

  const snapFlip = (targetBackFace: boolean) => {
    setIsAnimatingFlip(true);
    animateTo({
      from: flipProgress,
      to: targetBackFace ? 1 : 0,
      duration: 300,
      onFrame: (value) => setFlipProgress(value),
      onComplete: () => setIsAnimatingFlip(false),
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    drawerStartRef.current = drawerY;
    flipStartRef.current = flipProgress;
    dragAxisRef.current = "none";
    setIsInteracting(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;

    if (dragAxisRef.current === "none") {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (Math.max(absX, absY) < 10) {
        return;
      }

      if (absX > absY && openRatio >= 0.85) {
        dragAxisRef.current = "horizontal";
      } else {
        dragAxisRef.current = "vertical";
      }
    }

    if (dragAxisRef.current === "vertical") {
      if (isAnimatingDrawer) {
        return;
      }
      const next = Math.min(hiddenHeight, Math.max(0, drawerStartRef.current + deltaY));
      setDrawerY(next);
      return;
    }

    if (dragAxisRef.current === "horizontal") {
      if (isAnimatingFlip || !containerRef.current) {
        return;
      }

      const width = containerRef.current.clientWidth || 1;
      const progressDelta = -deltaX / width;
      const next = Math.min(1, Math.max(0, flipStartRef.current + progressDelta));
      setFlipProgress(next);
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const axis = dragAxisRef.current;
    if (axis === "vertical") {
      const shouldOpen = hiddenHeight === 0 ? true : openRatio > VERTICAL_THRESHOLD;
      snapDrawer(shouldOpen);
    }

    if (axis === "horizontal") {
      snapFlip(flipProgress > FLIP_THRESHOLD);
    }

    dragAxisRef.current = "none";
    pointerIdRef.current = null;
    setIsInteracting(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="relative min-h-[calc(100dvh-7rem)] md:min-h-0">
      <div
        className="fixed inset-0 md:absolute md:inset-auto md:left-1/2 md:top-6 md:w-[420px] md:-translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(209, 29, 29, 0.22), transparent 42%), radial-gradient(circle at 78% 8%, rgba(74, 16, 111, 0.22), transparent 36%), linear-gradient(180deg, #0a0408 0%, #13080f 72%, #0a0408 100%)",
          zIndex: 20,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.035),transparent_60%)]" />
        <div className="absolute inset-x-0 top-12 text-center">
          {!isInteracting && !isOpen && (
            <div className="pointer-events-none mx-auto inline-flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(245,230,211,0.72)]">
              <span className="text-xs leading-none animate-[float-gentle_2.1s_ease-in-out_infinite]">^</span>
              <span>Pull for ticket</span>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className="absolute inset-x-3 bottom-0 md:inset-x-0"
          style={{
            height: `${cardHeight}px`,
            transform: `translateY(${drawerY}px)`,
            transition: isInteracting || isAnimatingDrawer ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="absolute inset-0 rounded-[30px] border border-[rgba(212,165,116,0.45)] bg-[rgba(12,6,11,0.8)] shadow-[0_24px_56px_rgba(0,0,0,0.55)]" />
          <div
            className="relative h-full w-full overflow-hidden rounded-[30px]"
            style={{
              perspective: "1600px",
            }}
          >
            <div
              className="relative h-full w-full"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${flipProgress * 180}deg)`,
                transition: isInteracting || isAnimatingFlip ? "none" : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <article className="absolute inset-0 overflow-hidden rounded-[30px]" style={{ backfaceVisibility: "hidden" }}>
                <div className="absolute inset-0 bg-[#1a0f15]">
                  <div className="absolute inset-0">
                    <Image
                      src="/ticket_cropped.png"
                      alt="Savara ticket artwork"
                      fill
                      sizes="(max-width: 768px) 92vw, 420px"
                      className="object-cover"
                      style={{ transform: "rotate(-90deg) scale(1.35)", transformOrigin: "center" }}
                      priority
                    />
                  </div>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,4,8,0.22)_0%,rgba(10,4,8,0.58)_60%,rgba(10,4,8,0.8)_100%)]" />
                </div>

                <div className="absolute inset-x-0 bottom-0 border-t border-[rgba(212,165,116,0.45)] bg-[linear-gradient(90deg,#e37f1e_0%,#f09431_55%,#d17118_100%)] px-5 py-4 text-[#2f180a]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Participant</p>
                  <p className="mt-1 truncate text-lg font-bold uppercase leading-none">{displayName}</p>
                  <div className="mt-2 inline-flex rounded-full border border-[rgba(47,24,10,0.25)] bg-[rgba(255,255,255,0.28)] px-3 py-1 text-[11px] font-bold tracking-[0.14em]">
                    {ticketTypeLabel}
                  </div>
                </div>
              </article>

              <article
                className="absolute inset-0 overflow-hidden rounded-[30px]"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,#f2a043_0%,#ea8b2a_44%,#df7a1c_100%)]" />
                <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_100%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-[rgba(255,255,255,0.5)]" />

                <div className="relative flex h-full flex-col px-5 pb-5 pt-6 text-[#2f180a]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(47,24,10,0.78)]">Ticket Holder</p>
                      <p className="mt-1 text-xl font-bold uppercase leading-tight">{displayName}</p>
                    </div>
                    <span className="rounded-full border border-[rgba(47,24,10,0.26)] bg-[rgba(255,255,255,0.32)] px-3 py-1 text-[11px] font-bold tracking-[0.12em]">
                      {ticketTypeLabel}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[rgba(47,24,10,0.18)] bg-white/92 p-3">
                    <Image src={qrDataUrl} alt="Participant ticket QR code" width={240} height={240} className="mx-auto h-auto w-full max-w-[230px]" />
                  </div>

                  {showPerks && (
                    <div className="mt-5 min-h-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(47,24,10,0.78)]">Perks</p>
                      {visiblePerks.length === 0 ? (
                        <p className="mt-2 text-sm">No perks available.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 overflow-y-auto pr-1 text-[15px] leading-relaxed">
                          {visiblePerks.map((perk) => (
                            <li key={perk.perk_id} className={perk.attended ? "line-through opacity-70" : ""}>
                              {perk.perk_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
