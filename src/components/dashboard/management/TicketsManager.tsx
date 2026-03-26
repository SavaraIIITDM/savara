"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";
import { SkeletonRows } from "@/components/dashboard/management/SkeletonRows";

type CodeTicket = {
  id: string;
  created_at: string;
  participant_type: string;
  email: string;
};

type CodeResult = {
  id: string;
  code: string;
  purchaserEmail: string;
  ticketQuota: number;
  redeemedCount: number;
  purchaseType: string;
  isActive: boolean;
  createdAt: string;
  tickets: CodeTicket[];
};

type EmailResult = {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    participantType: string;
  } | null;
  ticket: {
    id: string;
    activationCode: string;
    createdAt: string;
  } | null;
  codes: Array<{
    id: string;
    code: string;
    purchaserEmail: string;
    ticketQuota: number;
    redeemedCount: number;
    purchaseType: string;
    isActive: boolean;
    createdAt: string;
    tickets: CodeTicket[];
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CodeCard({
  code,
  onDeleteTicket,
  onRevoke,
  busyTicketId,
  revokeBusy,
}: {
  code: CodeResult | EmailResult["codes"][number];
  onDeleteTicket: (ticketId: string) => Promise<void>;
  onRevoke: (codeId: string, count: number) => Promise<void>;
  busyTicketId: string;
  revokeBusy: string;
}) {
  return (
    <article className="mt-4 rounded-md border p-4" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{code.code}</h3>
        <InlineConfirmButton
          label={code.isActive ? "Revoke Code" : "Code Revoked"}
          confirmLabel="Confirm Revoke"
          consequence={`This will delete ${code.tickets.length} tickets and deactivate this code.`}
          busy={revokeBusy === code.id}
          busyLabel="Revoking..."
          onConfirm={async () => onRevoke(code.id, code.tickets.length)}
        />
      </div>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
        {code.purchaserEmail} · {code.purchaseType} · {code.redeemedCount}/{code.ticketQuota} redeemed · {code.isActive ? "active" : "inactive"}
      </p>
      <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
        Created {formatDate(code.createdAt)}
      </p>

      <div className="mt-3 space-y-2">
        {code.tickets.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
            No redeemed tickets under this code.
          </p>
        ) : (
          code.tickets.map((ticket) => (
            <div key={ticket.id} className="rounded border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.16)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{ticket.email}</p>
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                    {ticket.participant_type} · <span className="font-mono">{ticket.id}</span> · {formatDate(ticket.created_at)}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <InlineConfirmButton
                    label="Delete Ticket"
                    confirmLabel="Confirm Delete"
                    consequence="This ticket and linked registrations will be removed."
                    busy={busyTicketId === ticket.id}
                    busyLabel="Deleting..."
                    onConfirm={async () => onDeleteTicket(ticket.id)}
                  />
                </div>

                <div className="sm:hidden">
                  <InlineConfirmButton
                    label=""
                    confirmLabel="Confirm"
                    consequence="Delete ticket"
                    busy={busyTicketId === ticket.id}
                    busyLabel="..."
                    onConfirm={async () => onDeleteTicket(ticket.id)}
                  />
                  <span className="-ml-9 pointer-events-none inline-flex items-center">
                    <Trash2 size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

export function TicketsManager() {
  const [mode, setMode] = useState<"code" | "email">("code");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeResult, setCodeResult] = useState<CodeResult | null>(null);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);
  const [busyTicketId, setBusyTicketId] = useState("");
  const [busyCodeId, setBusyCodeId] = useState("");

  async function runSearch() {
    setLoading(true);
    setError("");
    setCodeResult(null);
    setEmailResult(null);
    try {
      const response = await fetch("/dashboard/admin/management/tickets/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", mode, query }),
      });
      const payload = (await response.json()) as {
        error?: string;
        result?: CodeResult | EmailResult | null;
        mode?: "code" | "email";
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to search.");
      }
      if (!payload.result) {
        return;
      }
      if (payload.mode === "code") {
        setCodeResult(payload.result as CodeResult);
      } else {
        setEmailResult(payload.result as EmailResult);
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unable to search.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTicket(ticketId: string) {
    setBusyTicketId(ticketId);
    setError("");
    try {
      const response = await fetch("/dashboard/admin/management/tickets/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteTicket", ticketId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete ticket.");
      }
      await runSearch();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete ticket.");
    } finally {
      setBusyTicketId("");
    }
  }

  async function revokeCode(codeId: string) {
    setBusyCodeId(codeId);
    setError("");
    try {
      const response = await fetch("/dashboard/admin/management/tickets/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revokeCode", codeId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to revoke code.");
      }
      await runSearch();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke code.");
    } finally {
      setBusyCodeId("");
    }
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: mode === "code" ? "var(--savara-gold)" : "rgba(212, 165, 116, 0.24)" }}
          onClick={() => {
            setMode("code");
            setCodeResult(null);
            setEmailResult(null);
          }}
        >
          By Activation Code
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: mode === "email" ? "var(--savara-gold)" : "rgba(212, 165, 116, 0.24)" }}
          onClick={() => {
            setMode("email");
            setCodeResult(null);
            setEmailResult(null);
          }}
        >
          By Email
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === "code" ? "Enter activation code" : "Enter purchaser or participant email"}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={!query.trim() || loading}
          className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ background: "var(--savara-gold)", color: "#0a0408" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error ? <InlineError message={error} /> : null}

      {loading ? <SkeletonRows count={4} /> : null}

      {!loading && !codeResult && !emailResult ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          {mode === "code" ? "No results for this code." : "No results for this email."}
        </p>
      ) : null}

      {codeResult ? (
        <CodeCard code={codeResult} onDeleteTicket={deleteTicket} onRevoke={revokeCode} busyTicketId={busyTicketId} revokeBusy={busyCodeId} />
      ) : null}

      {emailResult ? (
        <div className="mt-4 space-y-4">
          <article className="rounded-md border p-4" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
            <h3 className="text-lg font-bold">User</h3>
            {emailResult.user ? (
              <>
                <p className="mt-2 text-sm">{emailResult.user.fullName ?? "Unnamed participant"}</p>
                <p className="text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                  {emailResult.user.email} · {emailResult.user.participantType}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
                No profile found for this email.
              </p>
            )}
          </article>

          <article className="rounded-md border p-4" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
            <h3 className="text-lg font-bold">Ticket</h3>
            {emailResult.ticket ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-mono">{emailResult.ticket.id}</p>
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                    Code {emailResult.ticket.activationCode} · {formatDate(emailResult.ticket.createdAt)}
                  </p>
                </div>
                <InlineConfirmButton
                  label="Delete Ticket"
                  confirmLabel="Confirm Delete"
                  consequence="This ticket and linked registrations will be removed."
                  busy={busyTicketId === emailResult.ticket.id}
                  busyLabel="Deleting..."
                  onConfirm={async () => deleteTicket(emailResult.ticket!.id)}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
                No ticket found for this user.
              </p>
            )}
          </article>

          <article>
            <h3 className="text-lg font-bold">Activation Codes</h3>
            {emailResult.codes.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
                No activation codes purchased by this email.
              </p>
            ) : (
              emailResult.codes.map((code) => (
                <CodeCard
                  key={code.id}
                  code={code}
                  onDeleteTicket={deleteTicket}
                  onRevoke={revokeCode}
                  busyTicketId={busyTicketId}
                  revokeBusy={busyCodeId}
                />
              ))
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
