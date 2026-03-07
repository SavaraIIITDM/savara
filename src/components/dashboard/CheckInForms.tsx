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

type ScannerMode = "individual" | "remove" | "create-member" | "join-member";

const initialState = { error: "", success: "" };

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

export function CheckInForms({ events, teams }: { events: EventOption[]; teams: TeamOption[] }) {
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [mode, setMode] = useState<"individual" | "create-team" | "join-team">("individual");
  const [scannerMode, setScannerMode] = useState<ScannerMode | null>(null);
  const [scanFeedback, setScanFeedback] = useState("");
  const [scanError, setScanError] = useState("");

  const [individualToken, setIndividualToken] = useState("");
  const [removeToken, setRemoveToken] = useState("");

  const [createMembers, setCreateMembers] = useState<ScannedParticipant[]>([]);
  const [joinMembers, setJoinMembers] = useState<ScannedParticipant[]>([]);
  const [leaderQr, setLeaderQr] = useState("");
  const [teamName, setTeamName] = useState("");

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

  const eventTeams = useMemo(() => teams.filter((team) => team.eventId === selectedEvent), [teams, selectedEvent]);
  const selectedEventDetails = useMemo(() => events.find((event) => event.id === selectedEvent), [events, selectedEvent]);

  const [individualState, individualAction, individualPending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await checkInIndividualAction(formData);
      return { error: result.error ?? "", success: result.success ?? "" };
    },
    initialState,
  );

  const [removeState, removeAction, removePending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await removeCheckInAction(formData);
      return { error: result.error ?? "", success: result.success ?? "" };
    },
    initialState,
  );

  const [createState, createAction, createPending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await createTeamAction(formData);
      return { error: result.error ?? "", success: result.success ?? "" };
    },
    initialState,
  );

  const [joinState, joinAction, joinPending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await joinTeamAction(formData);
      return { error: result.error ?? "", success: result.success ?? "" };
    },
    initialState,
  );

  async function resolveParticipant(qrValue: string) {
    setScanError("");
    setScanFeedback("");

    const response = await fetch("/dashboard/events/check-in/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEvent,
        qrValue,
      }),
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
        setIndividualToken(participant.qrToken);
        setScanFeedback(`Ready: ${participant.fullName ?? participant.email}`);
        return;
      }

      if (scannerMode === "remove") {
        setRemoveToken(participant.qrToken);
        setScanFeedback(`Ready to remove: ${participant.fullName ?? participant.email}`);
        return;
      }

      if (scannerMode === "create-member") {
        setCreateMembers((current) => {
          if (current.some((member) => member.qrToken === participant.qrToken)) {
            setScanError("Participant already added to this team list.");
            return current;
          }
          return [...current, participant];
        });
        if (!leaderQr) {
          setLeaderQr(participant.qrToken);
        }
        setScanFeedback(`Added: ${participant.fullName ?? participant.email}`);
        return;
      }

      if (scannerMode === "join-member") {
        setJoinMembers((current) => {
          if (current.some((member) => member.qrToken === participant.qrToken)) {
            setScanError("Participant already added to this join list.");
            return current;
          }
          return [...current, participant];
        });
        setScanFeedback(`Added: ${participant.fullName ?? participant.email}`);
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Unable to resolve participant.");
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
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
            setIndividualToken("");
            setRemoveToken("");
            setCreateMembers([]);
            setJoinMembers([]);
            setLeaderQr("");
            setScanError("");
            setScanFeedback("");
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
            onClick={() => setMode("individual")}
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

        {scanError && (
          <p className="mt-3 text-sm" style={{ color: "#ff8c7a" }}>
            {scanError}
          </p>
        )}
        {scanFeedback && (
          <p className="mt-3 text-sm" style={{ color: "#a6e7b2" }}>
            {scanFeedback}
          </p>
        )}

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

            <ManualEntry onSubmit={async (value) => {
              const participant = await resolveParticipant(value);
              setIndividualToken(participant.qrToken);
              setScanFeedback(`Ready: ${participant.fullName ?? participant.email}`);
            }} />

            <form action={individualAction} className="space-y-2">
              <input type="hidden" name="eventId" value={selectedEvent} />
              <input type="hidden" name="qrToken" value={individualToken} />
              <button
                type="submit"
                disabled={individualPending || !individualToken}
                className="rounded-md border px-4 py-2 text-sm"
                style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
              >
                {individualPending ? "Checking..." : "Confirm Check-In"}
              </button>
              {individualState.error && <p className="text-sm" style={{ color: "#ff8c7a" }}>{individualState.error}</p>}
              {individualState.success && <p className="text-sm" style={{ color: "#a6e7b2" }}>{individualState.success}</p>}
            </form>

            <button
              type="button"
              onClick={() => setScannerMode("remove")}
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
            >
              Scan to Remove Check-In
            </button>

            <form action={removeAction} className="space-y-2">
              <input type="hidden" name="eventId" value={selectedEvent} />
              <input type="hidden" name="qrToken" value={removeToken} />
              <button
                type="submit"
                disabled={removePending || !removeToken}
                className="rounded-md border px-4 py-2 text-sm"
                style={{ borderColor: "rgba(212, 165, 116, 0.25)" }}
              >
                {removePending ? "Removing..." : "Confirm Remove"}
              </button>
              {removeState.error && <p className="text-sm" style={{ color: "#ff8c7a" }}>{removeState.error}</p>}
              {removeState.success && <p className="text-sm" style={{ color: "#a6e7b2" }}>{removeState.success}</p>}
            </form>
          </div>
        )}

        {mode === "create-team" && (
          <form action={createAction} className="mt-5 space-y-3">
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

            <ManualEntry onSubmit={async (value) => {
              const participant = await resolveParticipant(value);
              setCreateMembers((current) => {
                if (current.some((member) => member.qrToken === participant.qrToken)) {
                  setScanError("Participant already added to this team list.");
                  return current;
                }
                return [...current, participant];
              });
              if (!leaderQr) {
                setLeaderQr(participant.qrToken);
              }
              setScanFeedback(`Added: ${participant.fullName ?? participant.email}`);
            }} />

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
                        {member.alreadyRegistered ? " - already registered" : ""}
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

            <button
              type="submit"
              disabled={
                createPending ||
                !teamName.trim() ||
                !leaderQr ||
                createMembers.length < (selectedEventDetails?.teamMinSize ?? 1) ||
                createMembers.length > (selectedEventDetails?.teamMaxSize ?? 1)
              }
              className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ background: "var(--savara-gold)", color: "#0a0408" }}
            >
              {createPending ? "Creating..." : "Check In Team"}
            </button>
            {createState.error && <p className="text-sm" style={{ color: "#ff8c7a" }}>{createState.error}</p>}
            {createState.success && <p className="text-sm" style={{ color: "#a6e7b2" }}>{createState.success}</p>}
          </form>
        )}

        {mode === "join-team" && (
          <form action={joinAction} className="mt-5 space-y-3">
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

            <ManualEntry onSubmit={async (value) => {
              const participant = await resolveParticipant(value);
              setJoinMembers((current) => {
                if (current.some((member) => member.qrToken === participant.qrToken)) {
                  setScanError("Participant already added to this join list.");
                  return current;
                }
                return [...current, participant];
              });
              setScanFeedback(`Added: ${participant.fullName ?? participant.email}`);
            }} />

            <ul className="space-y-2 text-sm">
              {joinMembers.length === 0 && <li style={{ color: "rgba(245, 230, 211, 0.7)" }}>No members scanned yet.</li>}
              {joinMembers.map((member) => (
                <li key={member.qrToken} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      {member.fullName ?? member.email} ({member.email})
                      {member.alreadyRegistered ? " - already registered" : ""}
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

            <button
              type="submit"
              disabled={joinPending || joinMembers.length === 0}
              className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
              style={{ background: "var(--savara-gold)", color: "#0a0408" }}
            >
              {joinPending ? "Adding..." : "Add Members"}
            </button>
            {joinState.error && <p className="text-sm" style={{ color: "#ff8c7a" }}>{joinState.error}</p>}
            {joinState.success && <p className="text-sm" style={{ color: "#a6e7b2" }}>{joinState.success}</p>}
          </form>
        )}
      </article>

      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h2 className="text-xl font-bold uppercase">Existing Teams</h2>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
          Teams for selected event are shown below.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {eventTeams.length === 0 && <li style={{ color: "rgba(245, 230, 211, 0.7)" }}>No teams yet.</li>}
          {eventTeams.map((team) => (
            <li key={team.id} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              {team.name}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
