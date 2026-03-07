"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

type MobileQrScannerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onScan: (value: string) => void;
};

export function MobileQrScanner({ open, title, onClose, onScan }: MobileQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setError("");

    const start = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          videoRef.current,
          (result, decodeError) => {
            if (cancelled) {
              return;
            }

            if (result) {
              controls.stop();
              onScan(result.getText());
              return;
            }

            if (decodeError && decodeError.name !== "NotFoundException") {
              setError("Unable to read QR. Keep code within frame and try again.");
            }
          },
        );

        controlsRef.current = controls;
      } catch {
        setError("Camera access failed. Allow camera permission or use manual entry.");
      }
    };

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
    };
  }, [open, onScan]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[220] bg-black/85 px-4 pb-6 pt-12 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold uppercase tracking-[0.1em]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.35)" }}
          >
            Close
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "rgba(212, 165, 116, 0.35)" }}>
          <video ref={videoRef} className="block aspect-[3/4] w-full bg-black object-cover" muted playsInline />
        </div>

        <p className="mt-3 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
          Position the QR fully inside the frame.
        </p>
        {error && (
          <p className="mt-2 text-sm" style={{ color: "#ff8c7a" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
