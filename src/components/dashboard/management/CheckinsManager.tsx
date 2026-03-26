"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";
import { SkeletonRows } from "@/components/dashboard/management/SkeletonRows";

type EventOption = { id: string; name: string };
type CheckinRow = {
  id: number;
  checked_in_at: string;
  team_id: string | null;
  event_id: string;
  event_name: string;
  participant_email: string;
  volunteer_email: string | null;
};

type Stats = { total: number; team: number; individual: number };

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function CheckinsManager({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, team: 0, individual: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(0);
  const [expandedMobile, setExpandedMobile] = useState(0);

  const hasEvent = useMemo(() => events.some((event) => event.id === eventId), [events, eventId]);

  const loadRows = useCallback(async () => {
    if (!eventId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/dashboard/admin/management/checkins/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", eventId, email }),
      });
      const payload = (await response.json()) as {
        error?: string;
        rows?: CheckinRow[];
        stats?: Stats;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load check-ins.");
      }
      setRows(payload.rows ?? []);
      setStats(payload.stats ?? { total: 0, team: 0, individual: 0 });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load check-ins.");
      setRows([]);
      setStats({ total: 0, team: 0, individual: 0 });
    } finally {
      setLoading(false);
    }
  }, [email, eventId]);

  useEffect(() => {
    if (!hasEvent) {
      return;
    }
    void loadRows();
  }, [hasEvent, loadRows]);

  async function removeRow(checkinId: number) {
    setBusyId(checkinId);
    setError("");
    try {
      const response = await fetch("/dashboard/admin/management/checkins/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", checkinId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete check-in.");
      }
      await loadRows();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete check-in.");
    } finally {
      setBusyId(0);
    }
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        >
          {events.map((eventOption) => (
            <option key={eventOption.id} value={eventOption.id} style={{ color: "#0a0408" }}>
              {eventOption.name}
            </option>
          ))}
        </select>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Filter by email"
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        />
        <button
          type="button"
          onClick={() => void loadRows()}
          className="rounded-md border px-4 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
        >
          Apply
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
          Total checked in: {stats.total}
        </div>
        <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
          Team check-ins: {stats.team}
        </div>
        <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
          Individual: {stats.individual}
        </div>
      </div>

      {error ? <InlineError message={error} /> : null}
      {loading ? <SkeletonRows count={5} /> : null}

      {!loading && rows.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          No check-ins found for this filter.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
            <div className="hidden items-start justify-between gap-3 sm:flex">
              <div>
                <p className="font-medium">{row.participant_email}</p>
                <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                  {row.event_name} · {formatDate(row.checked_in_at)} · by {row.volunteer_email ?? "unknown"} · {row.team_id ? "team" : "individual"}
                </p>
              </div>
              <InlineConfirmButton
                label="Delete"
                confirmLabel="Confirm Delete"
                consequence="This check-in entry will be removed."
                busy={busyId === row.id}
                busyLabel="Deleting..."
                onConfirm={async () => removeRow(row.id)}
              />
            </div>

            <div className="sm:hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setExpandedMobile((current) => (current === row.id ? 0 : row.id))}
              >
                <span>
                  <p className="font-medium">{row.participant_email}</p>
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                    {formatDate(row.checked_in_at)}
                  </p>
                </span>
                <Trash2 size={14} />
              </button>

              {expandedMobile === row.id ? (
                <div className="mt-2">
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                    {row.event_name} · by {row.volunteer_email ?? "unknown"}
                  </p>
                  <InlineConfirmButton
                    label="Delete"
                    confirmLabel="Confirm"
                    consequence="Remove this check-in"
                    busy={busyId === row.id}
                    busyLabel="..."
                    onConfirm={async () => removeRow(row.id)}
                    className="mt-2"
                  />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
