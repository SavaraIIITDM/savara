"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";
import { SkeletonRows } from "@/components/dashboard/management/SkeletonRows";

type EventOption = { id: string; name: string };
type TeamRow = { id: string; name: string; leader_email: string; member_count: number };
type MemberRow = { ticket_id: string; participant_type: string; joined_at: string; email: string };

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function TeamsManager({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, MemberRow[]>>({});
  const [expandedTeamId, setExpandedTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyMemberId, setBusyMemberId] = useState("");
  const [busyTeamId, setBusyTeamId] = useState("");

  async function loadTeams(nextEventId: string) {
    if (!nextEventId) {
      return;
    }
    setLoading(true);
    setError("");
    setRows([]);
    setMembersByTeam({});
    try {
      const response = await fetch("/dashboard/admin/management/teams/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", eventId: nextEventId }),
      });
      const payload = (await response.json()) as { error?: string; rows?: TeamRow[] };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load teams.");
      }
      setRows(payload.rows ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load teams.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(teamId: string) {
    if (!eventId || !teamId) {
      return;
    }
    try {
      const response = await fetch("/dashboard/admin/management/teams/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "members", eventId, teamId }),
      });
      const payload = (await response.json()) as { error?: string; rows?: MemberRow[] };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load team members.");
      }
      setMembersByTeam((current) => ({ ...current, [teamId]: payload.rows ?? [] }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load team members.");
    }
  }

  useEffect(() => {
    if (!eventId) {
      return;
    }
    void loadTeams(eventId);
  }, [eventId]);

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={eventId}
          onChange={(event) => {
            setEventId(event.target.value);
            setExpandedTeamId("");
          }}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        >
          <option value="" style={{ color: "#0a0408" }}>
            Select event
          </option>
          {events.map((eventOption) => (
            <option key={eventOption.id} value={eventOption.id} style={{ color: "#0a0408" }}>
              {eventOption.name}
            </option>
          ))}
        </select>
      </div>

      {!eventId ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          Select an event to load team data.
        </p>
      ) : null}

      {error ? <InlineError message={error} /> : null}
      {loading ? <SkeletonRows count={4} /> : null}

      {!loading && eventId && rows.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          No teams found for this event.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const members = membersByTeam[row.id] ?? [];
          const expanded = expandedTeamId === row.id;

          return (
            <li key={row.id} className="rounded-md border" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left"
                onClick={() => {
                  const next = expanded ? "" : row.id;
                  setExpandedTeamId(next);
                  if (!expanded) {
                    void loadMembers(row.id);
                  }
                }}
              >
                <span>
                  <span className="font-medium">{row.name}</span>
                  <span className="ml-2 text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>
                    Leader: {row.leader_email} · {row.member_count} member(s)
                  </span>
                </span>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expanded ? (
                <div className="border-t px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.16)" }}>
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li key={member.ticket_id} className="rounded border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.14)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{member.email}</p>
                            <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                              {member.participant_type} · joined {formatDate(member.joined_at)}
                            </p>
                          </div>

                          <div className="hidden sm:block">
                            <InlineConfirmButton
                              label="Remove Member"
                              confirmLabel="Confirm Remove"
                              consequence="Member check-in for this event will also be removed."
                              busy={busyMemberId === member.ticket_id}
                              busyLabel="Removing..."
                              onConfirm={async () => {
                                setBusyMemberId(member.ticket_id);
                                setError("");
                                try {
                                  const response = await fetch("/dashboard/admin/management/teams/api", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "removeMember", eventId, teamId: row.id, ticketId: member.ticket_id }),
                                  });
                                  const payload = (await response.json()) as { error?: string };
                                  if (!response.ok) {
                                    throw new Error(payload.error ?? "Unable to remove member.");
                                  }
                                  await Promise.all([loadMembers(row.id), loadTeams(eventId)]);
                                } catch (memberError) {
                                  setError(memberError instanceof Error ? memberError.message : "Unable to remove member.");
                                } finally {
                                  setBusyMemberId("");
                                }
                              }}
                            />
                          </div>

                          <div className="sm:hidden">
                            <InlineConfirmButton
                              label=""
                              confirmLabel="Confirm"
                              consequence="Remove member"
                              busy={busyMemberId === member.ticket_id}
                              busyLabel="..."
                              onConfirm={async () => {
                                setBusyMemberId(member.ticket_id);
                                setError("");
                                try {
                                  const response = await fetch("/dashboard/admin/management/teams/api", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "removeMember", eventId, teamId: row.id, ticketId: member.ticket_id }),
                                  });
                                  const payload = (await response.json()) as { error?: string };
                                  if (!response.ok) {
                                    throw new Error(payload.error ?? "Unable to remove member.");
                                  }
                                  await Promise.all([loadMembers(row.id), loadTeams(eventId)]);
                                } catch (memberError) {
                                  setError(memberError instanceof Error ? memberError.message : "Unable to remove member.");
                                } finally {
                                  setBusyMemberId("");
                                }
                              }}
                            />
                            <span className="-ml-9 pointer-events-none inline-flex items-center">
                              <Trash2 size={14} />
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <InlineConfirmButton
                    label="Delete Team"
                    confirmLabel="Confirm Delete"
                    consequence="Allowed only when this team has zero check-ins in this event."
                    busy={busyTeamId === row.id}
                    busyLabel="Deleting..."
                    onConfirm={async () => {
                      setBusyTeamId(row.id);
                      setError("");
                      try {
                        const response = await fetch("/dashboard/admin/management/teams/api", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "deleteTeam", eventId, teamId: row.id }),
                        });
                        const payload = (await response.json()) as {
                          error?: string;
                          result?: { deleted: boolean; checkins: number };
                        };
                        if (!response.ok) {
                          throw new Error(payload.error ?? "Unable to delete team.");
                        }
                        if (!payload.result?.deleted) {
                          setError(`Cannot delete team. ${payload.result?.checkins ?? 0} check-in(s) exist.`);
                          return;
                        }
                        await loadTeams(eventId);
                        setExpandedTeamId("");
                      } catch (teamError) {
                        setError(teamError instanceof Error ? teamError.message : "Unable to delete team.");
                      } finally {
                        setBusyTeamId("");
                      }
                    }}
                    className="mt-3"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
