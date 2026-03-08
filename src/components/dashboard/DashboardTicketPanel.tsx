"use client";

import { useState } from "react";
import Link from "next/link";
import { TicketActivationForm } from "@/components/dashboard/TicketActivationForm";
import { TicketDrawerCard } from "@/components/dashboard/TicketDrawerCard";

type PerkItem = {
  perk_id: string;
  perk_name: string;
  attended: boolean;
};

type DashboardTicketPanelProps = {
  hasTicket: boolean;
  displayName: string;
  participantType: "internal" | "external";
  qrDataUrl: string | null;
  perks: PerkItem[];
  pendingCode: {
    code: string;
    ticketQuota: number;
    redeemedCount: number;
    remaining: number;
  } | null;
};

export function DashboardTicketPanel({
  hasTicket,
  displayName,
  participantType,
  qrDataUrl,
  perks,
  pendingCode,
}: DashboardTicketPanelProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h2 className="text-xl font-bold uppercase">Ticket</h2>
        {hasTicket ? (
          <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            Toggle your e-ticket. Pull up to reveal, drag down to hide, tap to flip.
          </p>
        ) : (
          <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
            Redeem your activation code to create your personal fest ticket.
          </p>
        )}

        {hasTicket && (
          <button
            type="button"
            className="mt-4 inline-block rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? "Hide Ticket" : "Show Ticket"}
          </button>
        )}

        {!hasTicket && (
          <div className="mt-4">
            <div className="rounded-md border px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.25)", background: "rgba(10, 4, 8, 0.25)" }}>
              <p className="text-sm" style={{ color: "rgba(245, 230, 211, 0.82)" }}>
                Don&apos;t have an activation code? Purchase tickets here.
              </p>
              <Link
                href="/tickets"
                className="mt-3 inline-block rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
                style={{ background: "var(--savara-gold)", color: "#0a0408" }}
              >
                Purchase Tickets
              </Link>
            </div>

            {pendingCode && (
              <div
                className="mt-3 rounded-md border px-3 py-3"
                style={{ borderColor: "rgba(212, 165, 116, 0.3)", background: "rgba(10, 4, 8, 0.25)" }}
              >
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(245, 230, 211, 0.6)" }}>
                  Assigned Activation Code
                </p>
                <p className="mt-1 text-xl font-bold tracking-[0.08em]">{pendingCode.code}</p>
                <p className="mt-1 text-xs" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                  {pendingCode.redeemedCount}/{pendingCode.ticketQuota} redeemed - {pendingCode.remaining} remaining
                </p>
              </div>
            )}

            <TicketActivationForm />
          </div>
        )}
      </article>

      {hasTicket && qrDataUrl && (
        <TicketDrawerCard
          visible={visible}
          onRequestHide={() => setVisible(false)}
          displayName={displayName}
          participantType={participantType}
          qrDataUrl={qrDataUrl}
          perks={perks}
        />
      )}
    </>
  );
}
