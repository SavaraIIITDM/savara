"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { addPerkAction, deletePerkAction, togglePerkAction } from "@/app/dashboard/admin/management/perks/actions";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";
import { SkeletonRows } from "@/components/dashboard/management/SkeletonRows";

type PerkRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type PerkAuditRow = {
  id: number;
  checked_in_at: string;
  perk_id: string;
  perk_name: string;
  participant_email: string;
  volunteer_email: string | null;
};

type PerkSummaryRow = {
  id: string;
  name: string;
  redemptions: number;
};

type ActionState = { error?: string; success?: string };
const initialAction: ActionState = {};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function PerksManager({ initialPerks }: { initialPerks: PerkRow[] }) {
  const [rows, setRows] = useState(initialPerks);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const [auditRows, setAuditRows] = useState<PerkAuditRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<PerkSummaryRow[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditPerkId, setAuditPerkId] = useState("");
  const [auditEmail, setAuditEmail] = useState("");
  const [busyDeleteAudit, setBusyDeleteAudit] = useState(0);
  const [busyDeletePerk, setBusyDeletePerk] = useState("");
  const [busyTogglePerk, setBusyTogglePerk] = useState("");

  const [addState, addFormAction, addPending] = useActionState(async (_: ActionState, formData: FormData) => {
    const result = await addPerkAction(formData);
    if (result.success && "perk" in result && result.perk) {
      const nextPerk = result.perk as PerkRow;
      setRows((current) => [...current, nextPerk].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setIsActive(true);
    }
    return result;
  }, initialAction);

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    setError("");
    try {
      const response = await fetch("/dashboard/admin/management/perks/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "audit", perkId: auditPerkId, email: auditEmail }),
      });
      const payload = (await response.json()) as {
        error?: string;
        rows?: PerkAuditRow[];
        summary?: PerkSummaryRow[];
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load audit.");
      }
      setAuditRows(payload.rows ?? []);
      setSummaryRows(payload.summary ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audit.");
      setAuditRows([]);
      setSummaryRows([]);
    } finally {
      setLoadingAudit(false);
    }
  }, [auditEmail, auditPerkId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const maxRedemptions = useMemo(() => Math.max(...summaryRows.map((row) => row.redemptions), 1), [summaryRows]);

  return (
    <section className="space-y-6">
      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h2 className="text-xl font-bold uppercase">Perk CRUD</h2>

        <form action={addFormAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Perk name"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
          <button type="submit" disabled={addPending} className="rounded-md border px-4 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
            {addPending ? "Adding..." : "Add Perk"}
          </button>
        </form>

        {addState.error ? <InlineError message={addState.error} /> : null}
        {error ? <InlineError message={error} /> : null}

        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-md border px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>
                    {formatDate(row.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    action={async () => {
                      setBusyTogglePerk(row.id);
                      setError("");
                      const formData = new FormData();
                      formData.set("id", row.id);
                      formData.set("isActive", row.isActive ? "false" : "true");
                      const result = await togglePerkAction(formData);
                      if (result.error) {
                        setError(result.error);
                      } else {
                        setRows((current) =>
                          current.map((item) => (item.id === row.id ? { ...item, isActive: !item.isActive } : item)),
                        );
                      }
                      setBusyTogglePerk("");
                    }}
                  >
                    <button type="submit" disabled={busyTogglePerk === row.id} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
                      {busyTogglePerk === row.id ? "Updating..." : row.isActive ? "Set Inactive" : "Set Active"}
                    </button>
                  </form>
                  <InlineConfirmButton
                    label="Delete"
                    confirmLabel="Confirm Delete"
                    consequence="Blocked automatically if redemptions exist."
                    busy={busyDeletePerk === row.id}
                    busyLabel="Deleting..."
                    onConfirm={async () => {
                      setBusyDeletePerk(row.id);
                      setError("");
                      const formData = new FormData();
                      formData.set("id", row.id);
                      const result = await deletePerkAction(formData);
                      if (result.error) {
                        setError(result.error);
                      } else {
                        setRows((current) => current.filter((item) => item.id !== row.id));
                      }
                      setBusyDeletePerk("");
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
        <h2 className="text-xl font-bold uppercase">Perk Check-in Audit</h2>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={auditPerkId}
            onChange={(event) => setAuditPerkId(event.target.value)}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          >
            <option value="" style={{ color: "#0a0408" }}>
              All perks
            </option>
            {rows.map((row) => (
              <option key={row.id} value={row.id} style={{ color: "#0a0408" }}>
                {row.name}
              </option>
            ))}
          </select>
          <input
            value={auditEmail}
            onChange={(event) => setAuditEmail(event.target.value)}
            placeholder="Search by email"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <button type="button" onClick={() => void loadAudit()} className="rounded-md border px-4 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
            Apply
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {summaryRows.map((row) => (
            <div key={row.id} className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{row.name}</span>
                <span>{row.redemptions}</span>
              </div>
              <div className="h-2 rounded" style={{ background: "rgba(245, 230, 211, 0.08)" }}>
                <div className="h-full rounded" style={{ width: `${(row.redemptions / maxRedemptions) * 100}%`, background: "linear-gradient(90deg, #d11d1d, #f09431, #4a106f)" }} />
              </div>
            </div>
          ))}
        </div>

        {loadingAudit ? <SkeletonRows count={4} /> : null}

        {!loadingAudit && auditRows.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
            No perk redemptions found for this filter.
          </p>
        ) : null}

        <ul className="mt-4 space-y-2">
          {auditRows.map((row) => (
            <li key={row.id} className="rounded-md border px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.participant_email}</p>
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.7)" }}>
                    {row.perk_name} · {formatDate(row.checked_in_at)} · by {row.volunteer_email ?? "unknown"}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <InlineConfirmButton
                    label="Delete"
                    confirmLabel="Confirm Delete"
                    consequence="This redemption audit entry will be removed."
                    busy={busyDeleteAudit === row.id}
                    busyLabel="Deleting..."
                    onConfirm={async () => {
                      setBusyDeleteAudit(row.id);
                      setError("");
                      const response = await fetch("/dashboard/admin/management/perks/api", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "deleteAudit", checkinId: row.id }),
                      });
                      const payload = (await response.json()) as { error?: string };
                      if (!response.ok) {
                        setError(payload.error ?? "Unable to delete perk audit entry.");
                      } else {
                        await loadAudit();
                      }
                      setBusyDeleteAudit(0);
                    }}
                  />
                </div>

                <div className="sm:hidden">
                  <InlineConfirmButton
                    label=""
                    confirmLabel="Confirm"
                    consequence="Delete redemption"
                    busy={busyDeleteAudit === row.id}
                    busyLabel="..."
                    onConfirm={async () => {
                      setBusyDeleteAudit(row.id);
                      setError("");
                      const response = await fetch("/dashboard/admin/management/perks/api", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "deleteAudit", checkinId: row.id }),
                      });
                      const payload = (await response.json()) as { error?: string };
                      if (!response.ok) {
                        setError(payload.error ?? "Unable to delete perk audit entry.");
                      } else {
                        await loadAudit();
                      }
                      setBusyDeleteAudit(0);
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
      </article>
    </section>
  );
}
