"use client";

import { useActionState, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { addEventAction, editEventAction, removeEventAction } from "@/app/dashboard/admin/management/events/actions";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";
import { slugify } from "@/lib/slugify";

type EventRow = {
  id: string;
  name: string;
  slug: string;
  teamMinSize: number;
  teamMaxSize: number;
  isActive: boolean;
  createdAt: string;
};

type ActionState = { error?: string; success?: string };
const initialAction: ActionState = {};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function EventsManager({ initialEvents }: { initialEvents: EventRow[] }) {
  const [rows, setRows] = useState(initialEvents);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState("");
  const [editId, setEditId] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [removeBusy, setRemoveBusy] = useState("");

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const [addState, addFormAction, addPending] = useActionState(async (_: ActionState, formData: FormData) => {
    const result = await addEventAction(formData);
    if (result.success && "event" in result && result.event) {
      setRows((current) => [...current, result.event as EventRow]);
      setNewName("");
      setNewSlug("");
      setShowAdd(false);
    }
    return result;
  }, initialAction);

  const [editState, editFormAction, editPending] = useActionState(async (_: ActionState, formData: FormData) => {
    const result = await editEventAction(formData);
    if (result.success) {
      const id = String(formData.get("id") ?? "").trim();
      const name = String(formData.get("name") ?? "").trim();
      const slug = String(formData.get("slug") ?? "").trim();
      const teamMinSize = Number(formData.get("teamMinSize") ?? 1);
      const teamMaxSize = Number(formData.get("teamMaxSize") ?? 1);
      const isActive = String(formData.get("isActive") ?? "").toLowerCase() === "on";
      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                name,
                slug,
                teamMinSize,
                teamMaxSize,
                isActive,
              }
            : row,
        ),
      );
      setEditId("");
    }
    return result;
  }, initialAction);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.name.localeCompare(b.name)), [rows]);

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <button
        type="button"
        onClick={() => setShowAdd((current) => !current)}
        className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
        style={{ background: "var(--savara-gold)", color: "#0a0408" }}
      >
        {showAdd ? "Close" : "Add Event"}
      </button>

      {showAdd ? (
        <form action={addFormAction} className="mt-4 grid gap-3 rounded-md border p-3" style={{ borderColor: "rgba(212, 165, 116, 0.22)" }}>
          <input
            name="name"
            required
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setNewSlug(slugify(event.target.value));
            }}
            placeholder="Name"
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <input
            name="slug"
            required
            value={newSlug}
            onChange={(event) => setNewSlug(slugify(event.target.value))}
            placeholder="Slug"
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="teamMinSize"
              min={1}
              defaultValue={1}
              required
              placeholder="Team Min Size"
              className="rounded-md border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
            />
            <input
              type="number"
              name="teamMaxSize"
              min={1}
              defaultValue={1}
              required
              placeholder="Team Max Size"
              className="rounded-md border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked />
            Is Active
          </label>
          <button
            type="submit"
            disabled={addPending}
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
          >
            {addPending ? "Adding..." : "Save Event"}
          </button>
          {addState.error ? <InlineError message={addState.error} /> : null}
        </form>
      ) : null}

      {removeError ? <InlineError message={removeError} /> : null}

      <ul className="mt-4 space-y-2">
        {sortedRows.map((row) => (
          <li key={row.id} className="rounded-md border" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-3 text-left"
              onClick={() => setExpandedId((current) => (current === row.id ? "" : row.id))}
            >
              <span>
                <span className="font-medium">{row.name}</span>
                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: row.isActive ? "rgba(166,231,178,0.5)" : "rgba(255,140,122,0.5)" }}>
                  {row.isActive ? "active" : "inactive"}
                </span>
              </span>
              {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedId === row.id ? (
              <div className="border-t px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.16)" }}>
                {editId === row.id ? (
                  <form action={editFormAction} className="grid gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input name="name" defaultValue={row.name} className="rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.28)" }} />
                    <input name="slug" defaultValue={row.slug} className="rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.28)" }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" name="teamMinSize" min={1} defaultValue={row.teamMinSize} className="rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.28)" }} />
                      <input type="number" name="teamMaxSize" min={1} defaultValue={row.teamMaxSize} className="rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.28)" }} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isActive" defaultChecked={row.isActive} />
                      Is Active
                    </label>
                    <div className="flex gap-2">
                      <button type="submit" disabled={editPending} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
                        {editPending ? "Saving..." : "Save"}
                      </button>
                      <button type="button" onClick={() => setEditId("")} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
                        Cancel
                      </button>
                    </div>
                    {editState.error ? <InlineError message={editState.error} /> : null}
                  </form>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                      Slug: <span className="font-mono">{row.slug}</span>
                    </p>
                    <p className="text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                      Team size: {row.teamMinSize} - {row.teamMaxSize}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(245, 230, 211, 0.64)" }}>
                      Created: {formatDate(row.createdAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(row.id)}
                        className="rounded-md border px-3 py-2 text-sm"
                        style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
                      >
                        Edit
                      </button>
                      <InlineConfirmButton
                        label="Delete"
                        confirmLabel="Confirm Delete"
                        consequence="Blocked automatically if check-ins exist."
                        busy={removeBusy === row.id}
                        busyLabel="Deleting..."
                        onConfirm={async () => {
                          setRemoveError("");
                          setRemoveBusy(row.id);
                          try {
                            const formData = new FormData();
                            formData.set("id", row.id);
                            const result = await removeEventAction(formData);
                            if (result.error) {
                              setRemoveError(result.error);
                              return;
                            }
                            setRows((current) => current.filter((eventRow) => eventRow.id !== row.id));
                          } finally {
                            setRemoveBusy("");
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
