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
  visible: boolean;
  displayName: string;
  participantType: "internal" | "external";
  qrDataUrl: string;
  ticketSerial: string;
  perks: PerkItem[];
  onRequestHide?: () => void;
};

const PEEK_HEIGHT = 86;
const VERTICAL_THRESHOLD = 0.25;
const FLIP_THRESHOLD = 0.3;
const ART_ASPECT = 708 / 1372;

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

export function TicketDrawerCard({ visible, displayName, participantType, qrDataUrl, ticketSerial, perks, onRequestHide }: TicketDrawerCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragAxisRef = useRef<"none" | "vertical" | "horizontal">("none");
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pointerDeltaRef = useRef({ x: 0, y: 0 });
  const drawerStartRef = useRef(0);
  const flipStartRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const movedRef = useRef(false);

  const [cardHeight, setCardHeight] = useState(620);
  const [cardWidth, setCardWidth] = useState(320);
  const [drawerY, setDrawerY] = useState(0);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isAnimatingDrawer, setIsAnimatingDrawer] = useState(false);
  const [isAnimatingFlip, setIsAnimatingFlip] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);

  const hiddenHeight = Math.max(0, cardHeight - PEEK_HEIGHT);
  const isOpen = drawerY <= 1;
  const openRatio = hiddenHeight === 0 ? 1 : 1 - drawerY / hiddenHeight;

  useEffect(() => {
    const recalc = () => {
      const maxHeight = Math.min(window.innerHeight - 24, 860);
      const maxWidth = Math.min(window.innerWidth * 0.94, 430);
      const nextWidth = Math.round(Math.min(maxWidth, maxHeight * ART_ASPECT));
      const nextHeight = Math.round(nextWidth / ART_ASPECT);
      const nextHidden = Math.max(0, nextHeight - PEEK_HEIGHT);
      setCardWidth(nextWidth);
      setCardHeight(nextHeight);
      setDrawerY((current) => {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          return nextHidden;
        }

        if (current <= 1 || visible) {
          return 0;
        }
        return nextHidden;
      });
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [visible]);

  useEffect(() => {
    if (pointerIdRef.current !== null || isInteracting) {
      return;
    }

    setIsAnimatingDrawer(true);
    animateTo({
      from: drawerY,
      to: visible ? 0 : hiddenHeight,
      duration: 360,
      onFrame: (value) => setDrawerY(value),
      onComplete: () => setIsAnimatingDrawer(false),
    });
  }, [visible, hiddenHeight, drawerY, isInteracting]);

  useEffect(() => {
    if (visible || isInteracting || pointerIdRef.current !== null) {
      return;
    }

    const isClosed = hiddenHeight === 0 ? drawerY <= 1 : drawerY >= hiddenHeight - 1;
    if (!isClosed || flipProgress <= 0.001) {
      return;
    }

    setIsAnimatingFlip(true);
    animateTo({
      from: flipProgress,
      to: 0,
      duration: 260,
      onFrame: (value) => setFlipProgress(value),
      onComplete: () => setIsAnimatingFlip(false),
    });
  }, [visible, isInteracting, hiddenHeight, drawerY, flipProgress]);

  const ticketTypeLabel = participantType.toUpperCase();
  const showPerks = participantType === "internal";
  const visiblePerks = useMemo(() => (showPerks ? perks : []), [perks, showPerks]);

  async function downloadPassImage() {
    if (downloadPending) {
      return;
    }

    setDownloadPending(true);
    try {
      const response = await fetch("/dashboard/ticket/pass", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("pass_download_failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
      const downloadName = filenameMatch?.[1] ?? `SAVARA_PASS_${ticketSerial}.png`;

      if (!isIOS) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch {
      window.alert("Unable to generate pass image right now. Please try again.");
    } finally {
      setDownloadPending(false);
    }
  }

  const snapDrawer = (targetOpen: boolean) => {
    setIsAnimatingDrawer(true);
    animateTo({
      from: drawerY,
      to: targetOpen ? 0 : hiddenHeight,
      duration: 360,
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

    const target = event.target as HTMLElement | null;
    const withinScrollArea = target?.closest('[data-ticket-scroll-area="true"]');
    if (withinScrollArea && isOpen) {
      return;
    }

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    pointerDeltaRef.current = { x: 0, y: 0 };
    drawerStartRef.current = drawerY;
    flipStartRef.current = flipProgress;
    dragAxisRef.current = "none";
    movedRef.current = false;
    setIsInteracting(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;
    pointerDeltaRef.current = { x: deltaX, y: deltaY };

    if (dragAxisRef.current === "none") {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (Math.max(absX, absY) < 8) {
        return;
      }

      movedRef.current = true;

      if (absX > absY && openRatio >= 0.65) {
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
      const dragRatio = Math.min(1, Math.abs(deltaX) / width);
      const isBackFaceStart = flipStartRef.current >= 0.5;
      const next = isBackFaceStart ? 1 - dragRatio : dragRatio;
      setFlipProgress(next);
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const axis = dragAxisRef.current;
    if (axis === "vertical") {
      const downwardRatio = hiddenHeight === 0 ? 0 : Math.max(0, drawerY) / hiddenHeight;
      const startedOpen = drawerStartRef.current <= 1;
      const shouldOpen = startedOpen ? downwardRatio < 0.06 : openRatio > VERTICAL_THRESHOLD;
      snapDrawer(shouldOpen);
    }

    if (axis === "horizontal") {
      const width = containerRef.current?.clientWidth || 1;
      const dragRatio = Math.min(1, Math.abs(pointerDeltaRef.current.x) / width);
      const isBackFaceStart = flipStartRef.current >= 0.5;
      const shouldFlipFace = dragRatio >= FLIP_THRESHOLD;
      snapFlip(shouldFlipFace ? !isBackFaceStart : isBackFaceStart);
    }

    if (axis === "none" && !movedRef.current) {
      const isBackFace = flipProgress >= 0.5;
      snapFlip(!isBackFace);
    }

    dragAxisRef.current = "none";
    pointerIdRef.current = null;
    setIsInteracting(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: 20,
        opacity: visible || isInteracting || isOpen ? 1 : 0,
        transition: "opacity 180ms ease-out",
      }}
    >
      {visible && <button type="button" className="pointer-events-auto absolute inset-0" onClick={onRequestHide} aria-label="Close ticket" />}

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
        className="pointer-events-auto absolute bottom-0 left-1/2"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transform: `translate(-50%, ${drawerY}px)`,
          transition: isInteracting || isAnimatingDrawer ? "none" : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="absolute inset-0 border border-[rgba(212,165,116,0.45)] bg-[rgba(12,6,11,0.8)] shadow-[0_24px_56px_rgba(0,0,0,0.55)]" />
        <button
          type="button"
          aria-label="Close ticket"
          className="absolute bottom-3 left-1/2 z-20 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-[rgba(212,165,116,0.7)] bg-[rgba(10,4,8,0.92)] text-lg font-bold leading-none text-[rgba(245,230,211,0.95)]"
          style={{ boxShadow: "0 6px 22px rgba(0,0,0,0.45)" }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRequestHide?.();
          }}
        >
          X
        </button>
        <div
          className="relative h-full w-full overflow-hidden"
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
            <article className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
              <div className="absolute inset-0 bg-[#1a0f15]">
                <div className="absolute inset-0">
                  <Image
                    src="/ticket_cropped_vertical.webp"
                    alt="Savara ticket artwork"
                    fill
                    sizes="(max-width: 768px) 90vw, 320px"
                    className="object-cover"
                    priority
                    draggable={false}
                  />
                </div>
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
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#f2a043_0%,#ea8b2a_44%,#df7a1c_100%)]" />
              <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-[rgba(255,255,255,0.5)]" />

              <div
                data-ticket-scroll-area="true"
                className="relative flex h-full flex-col overflow-y-auto px-5 pb-16 pt-6 text-[#2f180a]"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("button, a, input, textarea, select, [role='button']")) {
                    return;
                  }
                  const isBackFace = flipProgress >= 0.5;
                  snapFlip(!isBackFace);
                }}
              >
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
                  <Image
                    src={qrDataUrl}
                    alt="Participant ticket QR code"
                    width={240}
                    height={240}
                    className="mx-auto h-auto w-full max-w-[230px]"
                    draggable={false}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[rgba(47,24,10,0.18)] bg-[rgba(255,255,255,0.45)] px-3 py-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(47,24,10,0.72)]">Ticket Serial</p>
                    <p className="font-mono text-sm font-bold tracking-[0.18em]">{ticketSerial}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[rgba(47,24,10,0.28)] bg-[rgba(255,255,255,0.45)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={async (event) => {
                      event.stopPropagation();
                      await navigator.clipboard.writeText(ticketSerial);
                      setCopiedSerial(true);
                      window.setTimeout(() => setCopiedSerial(false), 1200);
                    }}
                  >
                    {copiedSerial ? "Copied" : "Copy"}
                  </button>
                </div>

                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-md border border-[rgba(47,24,10,0.25)] bg-[rgba(255,255,255,0.36)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em]"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={async (event) => {
                    event.stopPropagation();
                    await downloadPassImage();
                  }}
                >
                  {downloadPending ? "Preparing..." : "Download Pass PNG"}
                </button>

                {showPerks && (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(47,24,10,0.78)]">Perks</p>
                    {visiblePerks.length === 0 ? (
                      <p className="mt-2 text-sm">No perks available.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 pr-1 pb-2 text-[15px] leading-relaxed">
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

    </section>
  );
}
