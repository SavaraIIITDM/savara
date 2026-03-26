"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  confirmLabel: string;
  consequence?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
  variant?: "danger" | "warning";
  className?: string;
};

export function InlineConfirmButton({
  label,
  confirmLabel,
  consequence,
  busyLabel = "Working...",
  busy = false,
  onConfirm,
  variant = "danger",
  className = "",
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setConfirming(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const borderColor = confirming
    ? variant === "danger"
      ? "rgba(255, 107, 107, 0.8)"
      : "rgba(240, 173, 78, 0.8)"
    : "rgba(212, 165, 116, 0.3)";

  const textColor = confirming ? (variant === "danger" ? "#ffb0b0" : "#ffd79a") : "rgba(245, 230, 211, 0.92)";

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        disabled={busy}
        className="rounded-md border px-3 py-2 text-sm"
        style={{ borderColor, color: textColor }}
        onClick={async () => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          await onConfirm();
          setConfirming(false);
        }}
      >
        {busy ? busyLabel : confirming ? confirmLabel : label}
      </button>
      {confirming && consequence ? (
        <p className="mt-2 text-xs" style={{ color: variant === "danger" ? "#ff9a9a" : "#ffd79a" }}>
          {consequence}
        </p>
      ) : null}
    </div>
  );
}
