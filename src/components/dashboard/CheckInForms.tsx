"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  checkInIndividualAction,
  createTeamAction,
  joinTeamAction,
  removeCheckInAction,
} from "@/app/dashboard/events/check-in/actions";
import { MobileQrScanner } from "@/components/dashboard/MobileQrScanner";

type EventOption = {
  id: string;
  name: string;
  teamMinSize: number;
  teamMaxSize: number;
};

type TeamOption = {
  id: string;
  eventId: string;
  name: string;
};

type ScannedParticipant = {
  ticketId: string;
  qrToken: string;
  fullName: string | null;
  email: string;
  participantType: string;
  alreadyRegistered: boolean;
};

type EventParticipant = {
  checkin_id: number;
  checked_in_at: string;
  email: string;
  full_name: string | null;
  participant_type: string;
  team_id: string | null;
  team_name: string | null;
  ticket_id: string;
};

type ScannerMode = "individual" | "create-member" | "join-member";

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
};

const initialState: { error?: string; success?: string } = { error: "", success: "" };

function extractQrToken(rawValue: string) {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as { token?: string };
      return String(parsed.token ?? "").trim();
    } catch {
      return value;
    }
  }

  return value;
}

function ParticipantCard({ participant }: { participant: ScannedParticipant }) {
  return (
    <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
      <p className="font-medium">{participant.fullName ?? participant.email}</p>
      <p style={{ color: "rgba(245, 230, 211, 0.76)" }}>{participant.email}</p>
      <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
        {participant.participantType}
        {participant.alreadyRegistered ? " · already participating" : ""}
      </p>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[250] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-md border px-3 py-3 text-sm"
          style={{
            borderColor: toast.type === "success" ? "rgba(166, 231, 178, 0.45)" : "rgba(255, 140, 122, 0.45)",
            background: "rgba(10, 4, 8, 0.95)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p style={{ color: toast.type === "success" ? "#a6e7b2" : "#ff8c7a" }}>{toast.message}</p>
            <button type="button" className="text-xs underline" onClick={() => onDismiss(toast.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManualEntry({ onSubmit }: { onSubmit: (value: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="text-sm underline"
        style={{ color: "rgba(245, 230, 211, 0.8)" }}
      >
        {open ? "Hide manual entry" : "Enter token manually"}
      </button>

      {open && (
        <div className="mt-2 flex gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
            placeholder="Paste token or QR JSON"
          />
          <button
            type="button"
            disabled={busy || !value.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(value);
                setValue("");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export function CheckInForms({ events }: { events: EventOption[] }) {
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [mode, setMode] = useState<"individual" | "create-team" | "join-team">("individual");
  const [scannerMode, setScannerMode] = useState<ScannerMode | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [individualParticipant, setIndividualParticipant] = useState<ScannedParticipant | null>(null);

  const [createMembers, setCreateMembers] = useState<ScannedParticipant[]>([]);
  const [joinMembers, setJoinMembers] = useState<ScannedParticipant[]>([]);
  const [leaderQr, setLeaderQr] = useState("");
  const [teamName, setTeamName] = useState("");

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [showTeams, setShowTeams] = useState(false);

  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const [participantMenuOpenFor, setParticipantMenuOpenFor] = useState<string | null>(null);
  const [participantActionBusy, setParticipantActionBusy] = useState<string | null>(null);

  const [individualActionState, individualFormAction, individualPending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) => checkInIndividualAction(formData),
    initialState,
  );
  const [removeActionState, removeFormAction, removePending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) => removeCheckInAction(formData),
    initialState,
  );
  const [createActionState, createFormAction, createPending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) => createTeamAction(formData),
    initialState,
  );
  const [joinActionState, joinFormAction, joinPending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) => joinTeamAction(formData),
    initialState,
  );

  const eventTeams = useMemo(() => teams.filter((team) => team.eventId === selectedEvent), [teams, selectedEvent]);
  const selectedEventDetails = useMemo(() => events.find((event) => event.id === selectedEvent), [events, selectedEvent]);

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast(type: "success" | "error", message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  function clearScanState() {
    setIndividualParticipant(null);
    setCreateMembers([]);
    setJoinMembers([]);
    setLeaderQr("");
    setParticipantMenuOpenFor(null);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("checkin:selectedEvent");
    if (saved && events.some((event) => event.id === saved)) {
      setSelectedEvent(saved);
    }
  }, [events]);

  useEffect(() => {
    if (selectedEvent) {
      window.localStorage.setItem("checkin:selectedEvent", selectedEvent);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (individualActionState.error) {
      pushToast("error", individualActionState.error);
    }
    if (individualActionState.success) {
      pushToast("success", individualActionState.success);
      setIndividualParticipant(null);
      if (showParticipants) {
        void loadParticipants(selectedEvent);
      }
      if (showTeams) {
        void loadTeams(selectedEvent);
      }
    }
  }, [individualActionState.error, individualActionState.success]);

  useEffect(() => {
    if (removeActionState.error) {
      pushToast("error", removeActionState.error);
    }
    if (removeActionState.success) {
      pushToast("success", removeActionState.success);
      setIndividualParticipant(null);
      if (showParticipants) {
        void loadParticipants(selectedEvent);
      }
      if (showTeams) {
        void loadTeams(selectedEvent);
      }
    }
  }, [removeActionState.error, removeActionState.success]);

  useEffect(() => {
    if (createActionState.error) {
      pushToast("error", createActionState.error);
    }
    if (createActionState.success) {
      pushToast("success", createActionState.success);
      setTeamName("");
      setCreateMembers([]);
      setLeaderQr("");
      if (showParticipants) {
        void loadParticipants(selectedEvent);
      }
      if (showTeams) {
        void loadTeams(selectedEvent);
      }
    }
  }, [createActionState.error, createActionState.success]);

  useEffect(() => {
    if (joinActionState.error) {
      pushToast("error", joinActionState.error);
    }
    if (joinActionState.success) {
      pushToast("success", joinActionState.success);
      setJoinMembers([]);
      if (showParticipants) {
        void loadParticipants(selectedEvent);
      }
      if (showTeams) {
        void loadTeams(selectedEvent);
      }
    }
  }, [joinActionState.error, joinActionState.success]);

  async function loadTeams(eventId: string) {
    if (!eventId) {
      setTeams([]);
      return;
    }

    setTeamsLoading(true);
    try {
      const response = await fetch(`/dashboard/events/check-in/teams?eventId=${encodeURIComponent(eventId)}`);
      const payload = (await response.json()) as {
        error?: string;
        teams?: { id: string; event_id: string; name: string }[];
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load teams.");
      }
      setTeams((payload.teams ?? []).map((team) => ({ id: team.id, eventId: team.event_id, name: team.name })));
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unable to load teams.");
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }

  async function loadParticipants(eventId: string) {
    if (!eventId) {
      setEventParticipants([]);
      return;
    }

    setParticipantsLoading(true);
    try {
      const response = await fetch(`/dashboard/events/check-in/participants?eventId=${encodeURIComponent(eventId)}`);
      const payload = (await response.json()) as { error?: string; participants?: EventParticipant[] };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load participants.");
      }
      setEventParticipants(payload.participants ?? []);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unable to load participants.");
      setEventParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }

  async function resolveParticipant(qrValue: string) {
    const response = await fetch("/dashboard/events/check-in/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent, qrValue }),
    });

    const payload = (await response.json()) as {
      error?: string;
      participant?: {
        ticket_id: string;
        qr_token: string;
        full_name: string | null;
        email: string;
        participant_type: string;
        already_registered: boolean;
      };
    };

    if (!response.ok || !payload.participant) {
      throw new Error(payload.error ?? "Unable to resolve participant.");
    }

    return {
      ticketId: payload.participant.ticket_id,
      qrToken: payload.participant.qr_token,
      fullName: payload.participant.full_name,
      email: payload.participant.email,
      participantType: payload.participant.participant_type,
      alreadyRegistered: payload.participant.already_registered,
    } satisfies ScannedParticipant;
  }

  async function handleScannedValue(qrValue: string) {
    if (!scannerMode) {
      return;
    }

    try {
      const participant = await resolveParticipant(extractQrToken(qrValue));
      setScannerMode(null);

      if (scannerMode === "individual") {
        setIndividualParticipant(participant);
        return;
      }

      if (scannerMode === "create-member") {
        setCreateMembers((current) => {
          if (current.some((member) => member.qrToken === participant.qrToken)) {
            pushToast("error", "Participant already added to this team list.");
            return current;
          }
          return [...current, participant];
        });
        if (!leaderQr) {
          setLeaderQr(participant.qrToken);
        }
        return;
      }

      if (scannerMode === "join-member") {
        setJoinMembers((current) => {
          if (current.some((member) => member.qrToken === participant.qrToken)) {
            pushToast("error", "Participant already added to this join list.");
            return current;
          }
          return [...current, participant];
        });
      }
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unable to resolve participant.");
    }
  }

  async function removeParticipantFromList(ticketId: string) {
    setParticipantActionBusy(ticketId);
    try {
      const response = await fetch("/dashboard/events/check-in/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent, ticketId }),
      });
      const payload = (await response.json()) as { error?: string; removed?: boolean };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to remove participant.");
      }

      pushToast("success", payload.removed ? "Participant removed from this event." : "No check-in found to remove.");

      if (showParticipants) {
        await loadParticipants(selectedEvent);
      }
      if (showTeams) {
        await loadTeams(selectedEvent);
      }
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unable to remove participant.");
    } finally {
      setParticipantActionBusy(null);
      setParticipantMenuOpenFor(null);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <MobileQrScanner
        open={scannerMode !== null}
        title="Scan Participant QR"
        onClose={() => setScannerMode(null)}
        onScan={handleScannedValue}
      />

      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h1 className="text-2xl font-bold uppercase">Volunteer Check-In</h1>

        <label className="mt-4 block text-sm font-medium" htmlFor="eventSelect">
          Select Event
        </label>
        <select
          id="eventSelect"
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          value={selectedEvent}
          onChange={(event) => {
            setSelectedEvent(event.target.value);
            clearScanState();
            setTeamName("");
            setShowTeams(false);
            setShowParticipants(false);
            setTeams([]);
            setEventParticipants([]);
          }}
        >
          {events.map((eventOption) => (
            <option key={eventOption.id} value={eventOption.id} style={{ color: "#0a0408" }}>
              {eventOption.name}
            </option>
          ))}
        </select>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("individual");
              setIndividualParticipant(null);
            }}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: mode === "individual" ? "var(--savara-gold)" : "rgba(212, 165, 116, 0.2)" }}
          >
            Check In Individual
          </button>
          <button
            type="button"
            onClick={() => setMode("create-team")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: mode === "create-team" ? "var(--savara-gold)" : "rgba(212, 165, 116, 0.2)" }}
          >
            Create Team
          </button>
          <button
            type="button"
            onClick={() => setMode("join-team")}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: mode === "join-team" ? "var(--savara-gold)" : "rgba(212, 165, 116, 0.2)" }}
          >
            Join Team
          </button>
        </div>

        {mode === "individual" && (
          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => setScannerMode("individual")}
              className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ background: "var(--savara-gold)", color: "#0a0408" }}
            >
              Scan Participant QR
            </button>

            <ManualEntry
              onSubmit={async (value) => {
                const participant = await resolveParticipant(value);
                setIndividualParticipant(participant);
              }}
            />

            {individualParticipant && (
              <>
                <ParticipantCard participant={individualParticipant} />

                {individualParticipant.alreadyRegistered ? (
                  <form action={removeFormAction}>
                    <input type="hidden" name="eventId" value={selectedEvent} />
                    <input type="hidden" name="qrToken" value={individualParticipant.qrToken} />
                    <button
                      type="submit"
                      disabled={removePending}
                      className="rounded-md border px-4 py-2 text-sm"
                      style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
                    >
                      {removePending ? "Removing..." : "Remove Participant"}
                    </button>
                  </form>
                ) : (
                  <form action={individualFormAction}>
                    <input type="hidden" name="eventId" value={selectedEvent} />
                    <input type="hidden" name="qrToken" value={individualParticipant.qrToken} />
                    <button
                      type="submit"
                      disabled={individualPending}
                      className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                      style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                    >
                      {individualPending ? "Checking..." : "Confirm Check-In"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {mode === "create-team" && (
          <form action={createFormAction} className="mt-5 space-y-3">
            <input type="hidden" name="eventId" value={selectedEvent} />
            <input type="hidden" name="leaderQr" value={leaderQr} />
            <input type="hidden" name="memberQrsJson" value={JSON.stringify(createMembers.map((member) => member.qrToken))} />

            <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
              Team size for this event: {selectedEventDetails?.teamMinSize ?? 1} to {selectedEventDetails?.teamMaxSize ?? 1}
            </p>

            <input
              name="teamName"
              required
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Team name"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
            />

            <button
              type="button"
              onClick={() => setScannerMode("create-member")}
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
            >
              Add Member (Scan QR)
            </button>

            <ManualEntry
              onSubmit={async (value) => {
                const participant = await resolveParticipant(value);
                setCreateMembers((current) => {
                  if (current.some((member) => member.qrToken === participant.qrToken)) {
                    pushToast("error", "Participant already added to this team list.");
                    return current;
                  }
                  return [...current, participant];
                });
                if (!leaderQr) {
                  setLeaderQr(participant.qrToken);
                }
              }}
            />

            <ul className="space-y-2 text-sm">
              {createMembers.length === 0 && <li style={{ color: "rgba(245, 230, 211, 0.7)" }}>No members scanned yet.</li>}
              {createMembers.map((member) => (
                <li key={member.qrToken} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="leaderPick"
                        checked={leaderQr === member.qrToken}
                        onChange={() => setLeaderQr(member.qrToken)}
                      />
                      <span>
                        {member.fullName ?? member.email} ({member.email})
                        {member.alreadyRegistered ? " - already participating" : ""}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => {
                        setCreateMembers((current) => current.filter((item) => item.qrToken !== member.qrToken));
                        if (leaderQr === member.qrToken) {
                          setLeaderQr("");
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {teamName.trim() &&
              leaderQr &&
              createMembers.length >= (selectedEventDetails?.teamMinSize ?? 1) &&
              createMembers.length <= (selectedEventDetails?.teamMaxSize ?? 1) && (
                <button
                  type="submit"
                  disabled={createPending}
                  className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                  style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                >
                  {createPending ? "Creating..." : "Check In Team"}
                </button>
              )}
          </form>
        )}

        {mode === "join-team" && (
          <form action={joinFormAction} className="mt-5 space-y-3">
            <input type="hidden" name="memberQrsJson" value={JSON.stringify(joinMembers.map((member) => member.qrToken))} />
            <label className="block text-sm font-medium" htmlFor="teamId">
              Existing Team
            </label>
            <select
              id="teamId"
              name="teamId"
              required
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
            >
              {eventTeams.map((team) => (
                <option key={team.id} value={team.id} style={{ color: "#0a0408" }}>
                  {team.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setScannerMode("join-member")}
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
            >
              Add Member (Scan QR)
            </button>

            <ManualEntry
              onSubmit={async (value) => {
                const participant = await resolveParticipant(value);
                setJoinMembers((current) => {
                  if (current.some((member) => member.qrToken === participant.qrToken)) {
                    pushToast("error", "Participant already added to this join list.");
                    return current;
                  }
                  return [...current, participant];
                });
              }}
            />

            <ul className="space-y-2 text-sm">
              {joinMembers.length === 0 && <li style={{ color: "rgba(245, 230, 211, 0.7)" }}>No members scanned yet.</li>}
              {joinMembers.map((member) => (
                <li key={member.qrToken} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      {member.fullName ?? member.email} ({member.email})
                      {member.alreadyRegistered ? " - already participating" : ""}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => setJoinMembers((current) => current.filter((item) => item.qrToken !== member.qrToken))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {joinMembers.length > 0 && (
              <button
                type="submit"
                disabled={joinPending}
                className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                style={{ background: "var(--savara-gold)", color: "#0a0408" }}
              >
                {joinPending ? "Adding..." : "Add Members"}
              </button>
            )}
          </form>
        )}
      </article>

      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
            onClick={() => {
              const next = !showTeams;
              setShowTeams(next);
              if (next) {
                void loadTeams(selectedEvent);
              }
            }}
          >
            {showTeams ? "Hide Teams" : "View Teams"}
          </button>

          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
            onClick={() => {
              const next = !showParticipants;
              setShowParticipants(next);
              if (next) {
                void loadParticipants(selectedEvent);
              }
            }}
          >
            {showParticipants ? "Hide Participants" : "View Participants"}
          </button>

          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
            onClick={() => {
              if (showTeams) {
                void loadTeams(selectedEvent);
              }
              if (showParticipants) {
                void loadParticipants(selectedEvent);
              }
            }}
            disabled={!showTeams && !showParticipants}
          >
            Refresh Data
          </button>
        </div>

        {showTeams && (
          <>
            <h2 className="mt-6 text-xl font-bold uppercase">Existing Teams</h2>
            {teamsLoading ? (
              <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                Loading teams...
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {eventTeams.length === 0 && <li style={{ color: "rgba(245, 230, 211, 0.7)" }}>No teams yet.</li>}
                {eventTeams.map((team) => (
                  <li key={team.id} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
                    {team.name}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {showParticipants && (
          <>
            <h3 className="mt-6 text-xl font-bold uppercase">Existing Participants</h3>

            {participantsLoading ? (
              <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                Loading participants...
              </p>
            ) : eventParticipants.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                No participants checked in yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {eventParticipants.map((participant) => (
                  <li
                    key={`${participant.ticket_id}-${participant.checkin_id}`}
                    className="rounded-md border px-3 py-2"
                    style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {participant.full_name ?? participant.email}
                          <span className="ml-2 text-xs" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
                            ({participant.participant_type})
                          </span>
                        </p>
                        <p style={{ color: "rgba(245, 230, 211, 0.76)" }}>{participant.email}</p>
                        <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
                          {participant.team_name ? `Team: ${participant.team_name}` : "Individual"} · {new Date(participant.checked_in_at).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          className="rounded-md border px-2 py-1 text-xs"
                          style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
                          onClick={() =>
                            setParticipantMenuOpenFor((current) =>
                              current === participant.ticket_id ? null : participant.ticket_id,
                            )
                          }
                        >
                          More
                        </button>

                        {participantMenuOpenFor === participant.ticket_id && (
                          <div
                            className="absolute right-0 z-20 mt-2 min-w-32 rounded-md border p-1"
                            style={{
                              borderColor: "rgba(212, 165, 116, 0.25)",
                              background: "rgba(10, 4, 8, 0.95)",
                            }}
                          >
                            <button
                              type="button"
                              disabled={participantActionBusy === participant.ticket_id}
                              className="w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10"
                              onClick={() => void removeParticipantFromList(participant.ticket_id)}
                            >
                              {participantActionBusy === participant.ticket_id ? "Removing..." : "Delete Participant"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </article>
    </section>
  );
}
