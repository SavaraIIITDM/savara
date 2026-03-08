"use client";

import { useActionState, useEffect, useState } from "react";
import { MobileQrScanner } from "@/components/dashboard/MobileQrScanner";
import {
  checkInPerkIndividualAction,
  removePerkCheckInAction,
} from "@/app/dashboard/perks/check-in/actions";

type PerkOption = {
  id: string;
  name: string;
};

type PerkParticipant = {
  ticketId: string;
  qrToken: string;
  fullName: string | null;
  email: string;
  participantType: string;
  alreadyAttended: boolean;
  isEligible: boolean;
};

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

export function PerkCheckInForms({ perks }: { perks: PerkOption[] }) {
  const [selectedPerk, setSelectedPerk] = useState(perks[0]?.id ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [participant, setParticipant] = useState<PerkParticipant | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [checkinState, checkinAction, checkinPending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) =>
      checkInPerkIndividualAction(formData),
    initialState,
  );

  const [removeState, removeAction, removePending] = useActionState(
    async (_state: { error?: string; success?: string }, formData: FormData) =>
      removePerkCheckInAction(formData),
    initialState,
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("perk-checkin:selectedPerk");
    if (saved && perks.some((perk) => perk.id === saved)) {
      setSelectedPerk(saved);
    }
  }, [perks]);

  useEffect(() => {
    if (selectedPerk) {
      window.localStorage.setItem("perk-checkin:selectedPerk", selectedPerk);
    }
  }, [selectedPerk]);

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

  useEffect(() => {
    if (checkinState.error) {
      pushToast("error", checkinState.error);
    }
    if (checkinState.success) {
      pushToast("success", checkinState.success);
      setParticipant(null);
    }
  }, [checkinState.error, checkinState.success]);

  useEffect(() => {
    if (removeState.error) {
      pushToast("error", removeState.error);
    }
    if (removeState.success) {
      pushToast("success", removeState.success);
      setParticipant(null);
    }
  }, [removeState.error, removeState.success]);

  async function resolveParticipant(qrValue: string) {
    const response = await fetch("/dashboard/perks/check-in/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perkId: selectedPerk,
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
        already_attended: boolean;
        is_eligible: boolean;
      };
    };

    if (!response.ok || !payload.participant) {
      throw new Error(payload.error ?? "Unable to resolve participant.");
    }

    const resolved = {
      ticketId: payload.participant.ticket_id,
      qrToken: payload.participant.qr_token,
      fullName: payload.participant.full_name,
      email: payload.participant.email,
      participantType: payload.participant.participant_type,
      alreadyAttended: payload.participant.already_attended,
      isEligible: payload.participant.is_eligible,
    } satisfies PerkParticipant;

    if (!resolved.isEligible) {
      throw new Error("Perks are available only for internal participants.");
    }

    return resolved;
  }

  async function handleScan(qrValue: string) {
    try {
      const resolved = await resolveParticipant(extractQrToken(qrValue));
      setParticipant(resolved);
      setScannerOpen(false);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unable to resolve participant.");
    }
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <MobileQrScanner open={scannerOpen} title="Scan Perk QR" onClose={() => setScannerOpen(false)} onScan={handleScan} />

      <h1 className="text-2xl font-bold uppercase">Perk Check-In</h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Only internal participants can attend perks.
      </p>

      <label className="mt-4 block text-sm font-medium" htmlFor="perkSelect">
        Select Perk
      </label>
      <select
        id="perkSelect"
        className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
        style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        value={selectedPerk}
        onChange={(event) => {
          setSelectedPerk(event.target.value);
          setParticipant(null);
        }}
      >
        {perks.map((perk) => (
          <option key={perk.id} value={perk.id} style={{ color: "#0a0408" }}>
            {perk.name}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-4">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
          style={{ background: "var(--savara-gold)", color: "#0a0408" }}
        >
          Scan Participant QR
        </button>

        <ManualEntry
          onSubmit={async (value) => {
            const resolved = await resolveParticipant(value);
            setParticipant(resolved);
          }}
        />

        {participant && (
          <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.2)" }}>
            <p className="font-medium">{participant.fullName ?? participant.email}</p>
            <p style={{ color: "rgba(245, 230, 211, 0.76)" }}>{participant.email}</p>
            <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.65)" }}>
              {participant.participantType}
              {participant.alreadyAttended ? " · already attended this perk" : ""}
            </p>

            <div className="mt-3">
              {participant.alreadyAttended ? (
                <form action={removeAction}>
                  <input type="hidden" name="perkId" value={selectedPerk} />
                  <input type="hidden" name="qrToken" value={participant.qrToken} />
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
                <form action={checkinAction}>
                  <input type="hidden" name="perkId" value={selectedPerk} />
                  <input type="hidden" name="qrToken" value={participant.qrToken} />
                  <button
                    type="submit"
                    disabled={checkinPending}
                    className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                    style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                  >
                    {checkinPending ? "Checking..." : "Confirm Check-In"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
