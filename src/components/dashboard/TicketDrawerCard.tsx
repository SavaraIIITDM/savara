"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PEEK_HEIGHT = 86;
const ART_ASPECT = 708 / 1372;

// Dismiss: if dragged down more than this fraction of card height, or velocity exceeds this px/ms
const DISMISS_RATIO = 0.28;
const DISMISS_VELOCITY = 0.55; // px/ms — flick threshold

// Flip: if dragged more than this fraction of card width, commit the flip
const FLIP_RATIO = 0.28;
const FLIP_VELOCITY = 0.45;

// ─── Easing ───────────────────────────────────────────────────────────────────

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ─── Spring-style animator ────────────────────────────────────────────────────
// Returns a cancel function. All state is kept in refs — no React setState during RAF ticks.

function springTo(
  fromRef: { current: number },
  to: number,
  durationMs: number,
  onFrame: (v: number) => void,
  onDone?: () => void,
): () => void {
  let rafId = 0;
  let startTime = 0;
  const from = fromRef.current;

  const tick = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / durationMs);
    const value = from + (to - from) * easeOutExpo(t);
    fromRef.current = value;
    onFrame(value);
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      fromRef.current = to;
      onFrame(to);
      onDone?.();
    }
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketDrawerCard({
  visible,
  displayName,
  participantType,
  qrDataUrl,
  ticketSerial,
  perks,
  onRequestHide,
}: TicketDrawerCardProps) {
  // ── Dimension refs
  const cardRef = useRef<HTMLDivElement>(null);
  const cardDims = useRef({ width: 320, height: 620, hiddenHeight: 534 });

  // ── Animation value refs (source of truth during animations/gestures)
  const drawerYRef = useRef(0); // 0 = fully open, hiddenHeight = fully closed
  const flipRef = useRef(0); // 0 = front, 1 = back

  // ── Animation cancel handles
  const cancelDrawer = useRef<(() => void) | null>(null);
  const cancelFlip = useRef<(() => void) | null>(null);

  // ── Gesture tracking refs
  const pointerId = useRef<number | null>(null);
  const startXY = useRef({ x: 0, y: 0 });
  const startDrawerY = useRef(0);
  const startFlip = useRef(0);
  const axis = useRef<"none" | "vertical" | "horizontal">("none");
  const lastXY = useRef({ x: 0, y: 0, t: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 }); // px/ms
  const hasMoved = useRef(false);

  // ── React display state (updated from RAF for smooth rendering)
  const [drawerY, setDrawerY] = useState(0);
  const [flip, setFlip] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const initialized = useRef(false);

  // ── Compute card dimensions once and on resize
  const recalcDims = useCallback(() => {
    const maxH = Math.min(window.innerHeight - 24, 860);
    const maxW = Math.min(window.innerWidth * 0.94, 430);
    const w = Math.round(Math.min(maxW, maxH * ART_ASPECT));
    const h = Math.round(w / ART_ASPECT);
    const hidden = Math.max(0, h - PEEK_HEIGHT);
    cardDims.current = { width: w, height: h, hiddenHeight: hidden };
    return { w, h, hidden };
  }, []);

  // ── Animate drawer to target (0=open, hiddenHeight=closed)
  const animateDrawer = useCallback(
    (to: number, duration = 380, onDone?: () => void) => {
      cancelDrawer.current?.();
      cancelDrawer.current = springTo(
        drawerYRef,
        to,
        duration,
        (v) => {
          setDrawerY(v);
          setIsOpen(v <= 2);
        },
        () => {
          setDrawerY(to);
          setIsOpen(to <= 2);
          onDone?.();
        },
      );
    },
    [],
  );

  // ── Animate flip to target (0=front, 1=back)
  const animateFlip = useCallback((to: number, duration = 300) => {
    cancelFlip.current?.();
    cancelFlip.current = springTo(flipRef, to, duration, setFlip, () =>
      setFlip(to),
    );
  }, []);

  // ── Snap drawer (open/close decision)
  const snapDrawer = useCallback(
    (open: boolean) => {
      const { hiddenHeight } = cardDims.current;
      animateDrawer(open ? 0 : hiddenHeight);
    },
    [animateDrawer],
  );

  // ── Snap flip (front/back decision)
  const snapFlip = useCallback(
    (toBack: boolean) => {
      animateFlip(toBack ? 1 : 0);
    },
    [animateFlip],
  );

  // ── Init: place card at peeking position before first render
  useLayoutEffect(() => {
    const { hidden } = recalcDims();
    if (!initialized.current) {
      initialized.current = true;
      drawerYRef.current = hidden;
      setDrawerY(hidden);
      setIsOpen(false);
    }
  }, [recalcDims]);

  // ── React to `visible` prop changes
  useEffect(() => {
    if (pointerId.current !== null) return; // don't interrupt active gesture

    const { hiddenHeight } = cardDims.current;
    if (visible) {
      animateDrawer(0);
    } else {
      animateDrawer(hiddenHeight, 380, () => {
        // Once closed, snap flip back to front
        if (flipRef.current > 0.01) animateFlip(0, 260);
      });
    }
  }, [visible, animateDrawer, animateFlip]);

  // ── Resize handler
  useEffect(() => {
    const onResize = () => {
      recalcDims();
      // Reposition card without animation
      const { hiddenHeight } = cardDims.current;
      const target = isOpen ? 0 : hiddenHeight;
      drawerYRef.current = target;
      setDrawerY(target);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [recalcDims, isOpen]);

  // ─── Pointer handlers ─────────────────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== null) return;

      // Only block capture if the touch starts inside the scroll area AND the
      // scroll area itself has scrollable content that has been scrolled — i.e.
      // the user is genuinely scrolling the back-face content, not trying to
      // flip or dismiss. We never block horizontal starts here; axis is resolved
      // in onPointerMove once direction is clear.
      const target = e.target as HTMLElement;
      const scrollEl = target.closest<HTMLElement>("[data-scroll-area]");
      if (scrollEl && isOpen) {
        // Only defer to native scroll if the element actually has overflow
        // and is currently scrolled away from top — otherwise let our gesture
        // handler take over (tap-to-flip, swipe-to-dismiss, swipe-to-flip).
        const isScrolled = scrollEl.scrollTop > 4;
        if (isScrolled) return;
      }

      e.preventDefault();
      pointerId.current = e.pointerId;
      startXY.current = { x: e.clientX, y: e.clientY };
      lastXY.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      startDrawerY.current = drawerYRef.current;
      startFlip.current = flipRef.current;
      axis.current = "none";
      hasMoved.current = false;
      velocityRef.current = { vx: 0, vy: 0 };

      // Cancel any in-progress animations immediately
      cancelDrawer.current?.();
      cancelFlip.current?.();

      setIsInteracting(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isOpen],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;

    const dx = e.clientX - startXY.current.x;
    const dy = e.clientY - startXY.current.y;

    // Track instantaneous velocity
    const dt = e.timeStamp - lastXY.current.t;
    if (dt > 0) {
      velocityRef.current = {
        vx: (e.clientX - lastXY.current.x) / dt,
        vy: (e.clientY - lastXY.current.y) / dt,
      };
    }
    lastXY.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };

    // Determine axis lock
    if (axis.current === "none") {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 6) return; // dead zone
      hasMoved.current = true;
      const currentOpenRatio =
        cardDims.current.hiddenHeight === 0
          ? 1
          : 1 - drawerYRef.current / cardDims.current.hiddenHeight;
      // Only allow horizontal flip when card is substantially open
      axis.current =
        absX > absY && currentOpenRatio > 0.6 ? "horizontal" : "vertical";
    }

    if (axis.current === "vertical") {
      const { hiddenHeight } = cardDims.current;
      // Clamp: can't pull above 0 (add subtle rubber-band for opening past top)
      const raw = startDrawerY.current + dy;
      const clamped =
        raw < 0
          ? raw * 0.12 // rubber-band upward overshoot
          : Math.min(raw, hiddenHeight + 40); // allow slight over-pull downward
      drawerYRef.current = clamped;
      setDrawerY(clamped);
      setIsOpen(clamped <= 2);
    } else {
      // Horizontal flip drag
      const { width } = cardDims.current;
      const ratio = Math.min(1, Math.abs(dx) / width);
      const isBackStart = startFlip.current >= 0.5;
      const next = isBackStart ? 1 - ratio : ratio;
      flipRef.current = next;
      setFlip(next);
    }
  }, []);

  const onPointerEnd = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== e.pointerId) return;

      const { vy, vx } = velocityRef.current;
      const currentAxis = axis.current;

      // Reset gesture state
      pointerId.current = null;
      axis.current = "none";
      setIsInteracting(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (!hasMoved.current) {
        // Tap: toggle flip
        snapFlip(flipRef.current < 0.5);
        return;
      }

      if (currentAxis === "vertical") {
        const { hiddenHeight } = cardDims.current;
        const draggedRatio =
          hiddenHeight === 0 ? 0 : drawerYRef.current / hiddenHeight;
        const flickDown = vy > DISMISS_VELOCITY;
        const flickUp = vy < -DISMISS_VELOCITY;
        const wasOpen = startDrawerY.current <= 2;

        if (wasOpen) {
          // Dismiss if dragged far enough OR flicked down
          const shouldDismiss = flickDown || draggedRatio > DISMISS_RATIO;
          if (shouldDismiss) {
            // Animate to closed, then call onRequestHide
            animateDrawer(hiddenHeight, 300, () => {
              onRequestHide?.();
            });
          } else {
            // Snap back open
            snapDrawer(true);
          }
        } else {
          // Card was closed; open if flicked up or dragged up significantly
          const shouldOpen = flickUp || draggedRatio < 1 - DISMISS_RATIO;
          snapDrawer(shouldOpen);
        }
      } else if (currentAxis === "horizontal") {
        const { width } = cardDims.current;
        const dx = Math.abs(e.clientX - startXY.current.x);
        const ratio = Math.min(1, dx / width);
        const absVx = Math.abs(vx);
        const isBackStart = startFlip.current >= 0.5;

        const shouldFlip = ratio > FLIP_RATIO || absVx > FLIP_VELOCITY;
        snapFlip(shouldFlip ? !isBackStart : isBackStart);
      }
    },
    [snapDrawer, snapFlip, animateDrawer, onRequestHide],
  );

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      // navigator.clipboard requires HTTPS + document focus; fall back to execCommand
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // fall through to execCommand fallback
        }
      }
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText =
          "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    },
    [],
  );

  const downloadPassImage = useCallback(async () => {
    if (downloadPending) return;
    setDownloadPending(true);
    try {
      const response = await fetch("/dashboard/ticket/pass", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("pass_download_failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
      const downloadName =
        filenameMatch?.[1] ?? `SAVARA_PASS_${ticketSerial}.png`;

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
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch {
      alert("Unable to generate pass image right now. Please try again.");
    } finally {
      setDownloadPending(false);
    }
  }, [downloadPending, ticketSerial]);

  // ─── Derived display values ────────────────────────────────────────────────

  const { width: cardWidth, height: cardHeight } = cardDims.current;
  const ticketTypeLabel = participantType.toUpperCase();
  const showPerks = participantType === "internal";
  const isBackFace = flip >= 0.5;

  // Opacity: show when visible OR when in peek state
  const { hiddenHeight } = cardDims.current;
  const fullyHidden = !visible && !isInteracting && drawerY >= hiddenHeight - 1;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section
      aria-label="Ticket drawer"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 20 }}
    >
      {/* Backdrop tap to close */}
      {visible && (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0"
          onClick={onRequestHide}
          aria-label="Close ticket"
        />
      )}

      {/* Pull hint */}
      {!isInteracting && !isOpen && !fullyHidden && (
        <div
          className="pointer-events-none absolute inset-x-0 top-10 text-center"
          aria-hidden="true"
        >
          <div className="mx-auto inline-flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(245,230,211,0.65)]">
            <span
              className="text-xs leading-none"
              style={{ animation: "floatUp 2s ease-in-out infinite" }}
            >
              ↑
            </span>
            <span>Pull for ticket</span>
          </div>
        </div>
      )}

      {/* Card container — only pointer events when not fully hidden */}
      <div
        ref={cardRef}
        className="absolute bottom-0 left-1/2"
        style={{
          width: cardWidth,
          height: cardHeight,
          // GPU-composited transform — no layout thrashing
          transform: `translate3d(-50%, ${drawerY}px, 0)`,
          willChange: "transform",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: fullyHidden ? "none" : "auto",
          // Visibility toggle prevents any paint cost when fully off-screen
          visibility: fullyHidden ? "hidden" : "visible",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Card shell */}
        <div
          className="absolute inset-0 overflow-hidden border border-[rgba(212,165,116,0.45)] bg-[rgba(12,6,11,0.82)]"
          style={{
            boxShadow:
              "0 28px 64px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)",
            borderRadius: 2,
          }}
        />

        {/* 3-D flip container */}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ perspective: "1800px" }}
        >
          <div
            className="relative h-full w-full"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${flip * 180}deg)`,
              // During active drag, remove CSS transition (we drive it from JS).
              // When released, apply a short transition for the snap.
              transition: isInteracting
                ? "none"
                : "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform",
            }}
          >
            {/* ── FRONT FACE ─────────────────────────────────────────── */}
            <article
              className="absolute inset-0 overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              aria-hidden={isBackFace}
            >
              <div className="absolute inset-0 bg-[#1a0f15]">
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

              {/* Name strip */}
              <div className="absolute inset-x-0 bottom-0 border-t border-[rgba(212,165,116,0.45)] bg-[linear-gradient(90deg,#e37f1e_0%,#f09431_55%,#d17118_100%)] px-5 py-4 text-[#2f180a]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                  Participant
                </p>
                <p className="mt-1 truncate text-lg font-bold uppercase leading-none">
                  {displayName}
                </p>
                <div className="mt-2 inline-flex rounded-full border border-[rgba(47,24,10,0.25)] bg-[rgba(255,255,255,0.28)] px-3 py-1 text-[11px] font-bold tracking-[0.14em]">
                  {ticketTypeLabel}
                </div>
              </div>
            </article>

            {/* ── BACK FACE ──────────────────────────────────────────── */}
            <article
              className="absolute inset-0 overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              aria-hidden={!isBackFace}
            >
              {/* Warm orange gradient background */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,#f2a043_0%,#ea8b2a_44%,#df7a1c_100%)]" />
              <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-[rgba(255,255,255,0.5)]" />

              <div
                data-scroll-area
                className="relative flex h-full flex-col overflow-y-auto px-5 pb-14 pt-6 text-[#2f180a]"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(47,24,10,0.75)]">
                      Ticket Holder
                    </p>
                    <p className="mt-1 text-xl font-bold uppercase leading-tight">
                      {displayName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[rgba(47,24,10,0.26)] bg-[rgba(255,255,255,0.32)] px-3 py-1 text-[11px] font-bold tracking-[0.12em]">
                    {ticketTypeLabel}
                  </span>
                </div>

                {/* QR code */}
                <div className="mt-5 rounded-2xl border border-[rgba(47,24,10,0.18)] bg-white/95 p-3">
                  <Image
                    src={qrDataUrl}
                    alt="Participant ticket QR code"
                    width={240}
                    height={240}
                    className="mx-auto h-auto w-full max-w-[230px]"
                    draggable={false}
                  />
                </div>

                {/* Ticket serial */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[rgba(47,24,10,0.18)] bg-[rgba(255,255,255,0.45)] px-3 py-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(47,24,10,0.72)]">
                      Ticket Serial
                    </p>
                    <p className="font-mono text-sm font-bold tracking-[0.18em]">
                      {ticketSerial}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[rgba(47,24,10,0.28)] bg-[rgba(255,255,255,0.45)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] active:opacity-70"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await navigator.clipboard.writeText(ticketSerial);
                      setCopiedSerial(true);
                      setTimeout(() => setCopiedSerial(false), 1200);
                    }}
                  >
                    {copiedSerial ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Download button */}
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center rounded-md border border-[rgba(47,24,10,0.25)] bg-[rgba(255,255,255,0.36)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] active:opacity-70"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await downloadPassImage();
                  }}
                >
                  {downloadPending ? "Preparing…" : "Download Pass PNG"}
                </button>

                {/* Perks */}
                {showPerks && (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(47,24,10,0.78)]">
                      Perks
                    </p>
                    {perks.length === 0 ? (
                      <p className="mt-2 text-sm">No perks available.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 pb-2 pr-1 text-[15px] leading-relaxed">
                        {perks.map((perk) => (
                          <li
                            key={perk.perk_id}
                            className={
                              perk.attended ? "line-through opacity-60" : ""
                            }
                          >
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

        {/* Drag handle pill (purely decorative) */}
        <div
          className="absolute inset-x-0 top-0 flex justify-center pt-2.5"
          aria-hidden="true"
        >
          <div className="h-[3px] w-10 rounded-full bg-[rgba(245,230,211,0.35)]" />
        </div>
      </div>

      {/* Float animation keyframe */}
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); opacity: 0.65; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
