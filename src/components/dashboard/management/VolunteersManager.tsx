"use client";

import { useActionState, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { addVolunteerAction, removeVolunteerAction } from "@/app/dashboard/admin/management/volunteers/actions";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";

type VolunteerRow = {
  email: string;
  isAdmin: boolean;
  isVolunteer: boolean;
  isEventVolunteer: boolean;
  isPerkVolunteer: boolean;
};

type AccessRoleType = "volunteer" | "event_volunteer" | "perk_volunteer";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

function pickRoleType(row: VolunteerRow): AccessRoleType | null {
  if (row.isVolunteer) return "volunteer";
  if (row.isEventVolunteer) return "event_volunteer";
  if (row.isPerkVolunteer) return "perk_volunteer";
  return null;
}

export function VolunteersManager({
  initialVolunteers,
  currentAdminEmail,
}: {
  initialVolunteers: VolunteerRow[];
  currentAdminEmail: string;
}) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [rows, setRows] = useState(initialVolunteers);
  const [selectedRoleType, setSelectedRoleType] = useState<AccessRoleType>("volunteer");

  const [addState, addFormAction, addPending] = useActionState(async (_: ActionState, formData: FormData) => {
    const result = await addVolunteerAction(formData);
    if (result.success) {
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const roleType = String(formData.get("roleType") ?? "").trim().toLowerCase() as AccessRoleType;
      const patch = {
        isVolunteer: roleType === "volunteer",
        isEventVolunteer: roleType === "event_volunteer",
        isPerkVolunteer: roleType === "perk_volunteer",
      };
      if (email && !rows.some((row) => row.email === email)) {
        setRows((current) => [...current, { email, isAdmin: false, ...patch }].sort((a, b) => a.email.localeCompare(b.email)));
      } else if (email) {
        setRows((current) => current.map((row) => (row.email === email ? { ...row, ...patch } : row)));
      }
    }
    return result;
  }, initialState);

  const [removeError, setRemoveError] = useState("");
  const [removeBusyEmail, setRemoveBusyEmail] = useState("");

  const handleRemoveVolunteer = async (row: VolunteerRow) => {
    setRemoveError("");
    setRemoveBusyEmail(row.email);
    try {
      const roleType = pickRoleType(row);
      if (!roleType) {
        setRemoveError("No volunteer role found for this account.");
        return;
      }

      const formData = new FormData();
      formData.set("email", row.email);
      formData.set("roleType", roleType);
      const result = await removeVolunteerAction(formData);
      if (result.error) {
        setRemoveError(result.error);
        return;
      }

      setRows((current) =>
        current.flatMap((item) => {
          if (item.email !== row.email) return [item];

          const nextRow = {
            ...item,
            isVolunteer: roleType === "volunteer" ? false : item.isVolunteer,
            isEventVolunteer: roleType === "event_volunteer" ? false : item.isEventVolunteer,
            isPerkVolunteer: roleType === "perk_volunteer" ? false : item.isPerkVolunteer,
          };

          if (!nextRow.isVolunteer && !nextRow.isEventVolunteer && !nextRow.isPerkVolunteer) {
            return [];
          }

          return [nextRow];
        }),
      );
    } finally {
      setRemoveBusyEmail("");
    }
  };

  const filteredRows = useMemo(
    () => rows.filter((row) => row.email.toLowerCase().includes(search.trim().toLowerCase())),
    [rows, search],
  );

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email"
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        />
        <button
          type="button"
          onClick={() => setShowAddForm((current) => !current)}
          className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ background: "var(--savara-gold)", color: "#0a0408" }}
        >
          {showAddForm ? "Close" : "Add Volunteer"}
        </button>
      </div>

      {showAddForm ? (
        <form action={addFormAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            name="email"
            required
            placeholder="volunteer@example.com"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <fieldset className="rounded-md border px-3 py-2" style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}>
            <legend className="px-1 text-xs" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
              Access Role
            </legend>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="roleType"
                  value="volunteer"
                  checked={selectedRoleType === "volunteer"}
                  onChange={() => setSelectedRoleType("volunteer")}
                />
                volunteer
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="roleType"
                  value="event_volunteer"
                  checked={selectedRoleType === "event_volunteer"}
                  onChange={() => setSelectedRoleType("event_volunteer")}
                />
                event_volunteer
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="roleType"
                  value="perk_volunteer"
                  checked={selectedRoleType === "perk_volunteer"}
                  onChange={() => setSelectedRoleType("perk_volunteer")}
                />
                perk_volunteer
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={addPending}
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
          >
            {addPending ? "Adding..." : "Save"}
          </button>
        </form>
      ) : null}

      {addState.error ? <InlineError message={addState.error} /> : null}
      {removeError ? <InlineError message={removeError} /> : null}

      {filteredRows.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          No volunteers added yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredRows.map((row) => (
            <li key={row.email} className="rounded-md border px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.email}</p>
                  {row.isAdmin ? (
                    <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>
                      admin
                    </p>
                  ) : null}
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>
                    {row.isVolunteer ? "volunteer" : row.isEventVolunteer ? "event_volunteer" : row.isPerkVolunteer ? "perk_volunteer" : "-"}
                  </p>
                </div>

                {row.isAdmin && row.email !== currentAdminEmail ? (
                  <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>admin</p>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <InlineConfirmButton
                        label="Remove"
                        confirmLabel="Confirm Remove"
                        consequence="Volunteer privileges will be revoked."
                        busy={removeBusyEmail === row.email}
                        busyLabel="Removing..."
                        onConfirm={() => handleRemoveVolunteer(row)}
                      />
                    </div>

                    <div className="sm:hidden">
                      <InlineConfirmButton
                        label=""
                        confirmLabel="Confirm"
                        consequence="Remove volunteer access"
                        busy={removeBusyEmail === row.email}
                        busyLabel="..."
                        onConfirm={() => handleRemoveVolunteer(row)}
                        className="inline-block"
                      />
                      <span className="-ml-9 pointer-events-none inline-flex items-center">
                        <Trash2 size={14} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
