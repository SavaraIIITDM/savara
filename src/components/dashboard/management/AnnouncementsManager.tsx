"use client";

import { useActionState, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { deleteAnnouncementAction, publishAnnouncementAction } from "@/app/dashboard/admin/management/announcements/actions";
import { InlineConfirmButton } from "@/components/dashboard/management/InlineConfirmButton";
import { InlineError } from "@/components/dashboard/management/InlineError";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type ActionState = { error?: string; success?: string };
const initialAction: ActionState = {};

function relativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function absoluteTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnnouncementsManager({ initialAnnouncements }: { initialAnnouncements: AnnouncementRow[] }) {
  const [rows, setRows] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [removeBusy, setRemoveBusy] = useState("");

  const [publishState, publishFormAction, publishPending] = useActionState(async (_: ActionState, formData: FormData) => {
    const result = await publishAnnouncementAction(formData);
    if (result.success && "announcement" in result && result.announcement) {
      setRows((current) => [result.announcement as AnnouncementRow, ...current]);
      setShowForm(false);
      setTitle("");
      setBody("");
    }
    return result;
  }, initialAction);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rows],
  );

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}>
      <button
        type="button"
        onClick={() => setShowForm((current) => !current)}
        className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
        style={{ background: "var(--savara-gold)", color: "#0a0408" }}
      >
        {showForm ? "Close" : "New Announcement"}
      </button>

      {showForm ? (
        <form action={publishFormAction} className="mt-4 grid gap-3 rounded-md border p-3" style={{ borderColor: "rgba(212, 165, 116, 0.22)" }}>
          <input
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <textarea
            name="body"
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            placeholder="Announcement body"
            className="rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
          />
          <button
            type="submit"
            disabled={publishPending}
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}
          >
            {publishPending ? "Publishing..." : "Publish"}
          </button>
          {publishState.error ? <InlineError message={publishState.error} /> : null}
        </form>
      ) : null}

      {removeError ? <InlineError message={removeError} /> : null}

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
          No announcements published yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sorted.map((row) => (
            <li key={row.id} className="rounded-md border" style={{ borderColor: "rgba(212, 165, 116, 0.18)" }}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left"
                onClick={() => setExpandedId((current) => (current === row.id ? "" : row.id))}
              >
                <span>
                  <span className="font-medium">{row.title}</span>
                  <span className="ml-2 text-xs" style={{ color: "rgba(245, 230, 211, 0.68)" }}>
                    {relativeTime(row.createdAt)}
                  </span>
                </span>
                {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedId === row.id ? (
                <div className="border-t px-3 py-3" style={{ borderColor: "rgba(212, 165, 116, 0.16)" }}>
                  <p className="whitespace-pre-wrap text-sm" style={{ color: "rgba(245, 230, 211, 0.88)" }}>
                    {row.body}
                  </p>
                  <p className="mt-2 text-xs font-mono" style={{ color: "rgba(245, 230, 211, 0.62)" }}>
                    {absoluteTime(row.createdAt)}
                  </p>
                  <InlineConfirmButton
                    label="Delete"
                    confirmLabel="Confirm Delete"
                    consequence="This will remove the announcement for all users."
                    busy={removeBusy === row.id}
                    busyLabel="Deleting..."
                    onConfirm={async () => {
                      setRemoveBusy(row.id);
                      setRemoveError("");
                      try {
                        const formData = new FormData();
                        formData.set("id", row.id);
                        const result = await deleteAnnouncementAction(formData);
                        if (result.error) {
                          setRemoveError(result.error);
                          return;
                        }
                        setRows((current) => current.filter((item) => item.id !== row.id));
                        setExpandedId("");
                      } finally {
                        setRemoveBusy("");
                      }
                    }}
                    className="mt-3"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
