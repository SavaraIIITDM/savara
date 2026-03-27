"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

function relativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function AnnouncementPopup({ announcement }: { announcement: Announcement | null }) {
  const [open, setOpen] = useState(Boolean(announcement));
  const stamp = useMemo(() => (announcement ? relativeTime(announcement.createdAt) : ""), [announcement]);

  if (!announcement || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ background: "rgba(0, 0, 0, 0.75)" }}
        onClick={() => setOpen(false)}
      />

      <article
        className="relative w-full max-w-[420px] rounded-xl border p-5 opacity-100 shadow-2xl transition duration-150 ease-out"
        style={{
          borderColor: "rgba(212, 165, 116, 0.28)",
          background: "rgba(20, 12, 15, 0.98)",
          transform: "scale(1)",
          animation: "announcement-enter 160ms ease-out",
        }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "rgba(245, 230, 211, 0.56)" }}>
          Announcement
        </p>
        <h2 className="mt-2 text-2xl font-bold" style={{ lineHeight: 1.2 }}>
          {announcement.title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm" style={{ color: "rgba(245, 230, 211, 0.9)" }}>
          {announcement.body}
        </p>
        <p className="mt-3 font-mono text-xs" style={{ color: "rgba(245, 230, 211, 0.64)" }}>
          {stamp}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/announcements"
            onClick={() => setOpen(false)}
            className="w-full rounded-md border px-4 py-2 text-center text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
          >
            All Announcements
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-md px-4 py-2 text-sm"
            style={{ background: "var(--savara-gold)", color: "#0a0408" }}
          >
            Dismiss
          </button>
        </div>
      </article>
    </div>
  );
}
