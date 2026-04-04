"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateCertificateNameAction } from "@/app/dashboard/actions";

type CertificateRow = {
  checkinId: number;
  eventName: string;
  checkedInAt: string;
};

type Props = {
  initialName: string;
  hasChangedCertificateName: boolean;
  certificates: CertificateRow[];
};

const initialState = {
  error: "",
  success: "",
  updatedName: "",
};

export function ParticipationCertificatesClient({
  initialName,
  hasChangedCertificateName,
  certificates,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(!hasChangedCertificateName);
  const [mode, setMode] = useState<"review" | "change">("review");
  const [confirmingFinal, setConfirmingFinal] = useState(false);
  const [downloadBusyId, setDownloadBusyId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await updateCertificateNameAction(formData);
      return {
        error: result.error ?? "",
        success: result.success ?? "",
        updatedName: result.updatedName ?? "",
      };
    },
    initialState,
  );

  const effectiveName = useMemo(() => {
    const name = state.updatedName || initialName;
    return name.trim() || "Participant";
  }, [initialName, state.updatedName]);

  const nameLocked = hasChangedCertificateName || Boolean(state.success);

  useEffect(() => {
    if (state.success) {
      setDialogOpen(false);
    }
  }, [state.success]);

  async function handleDownload(checkinId: number) {
    setDownloadBusyId(checkinId);
    setDownloadError("");
    try {
      const response = await fetch(`/dashboard/pcertificates/generate?checkinId=${checkinId}`);
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error ?? "Unable to generate certificate.");
      }

      const disposition = response.headers.get("content-disposition") ?? "";
      const matched = disposition.match(/filename="([^"]+)"/i);
      const downloadFileName = matched?.[1] || `savara_participation_${String(checkinId).slice(-6)}.png`;
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = downloadFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to generate certificate.");
    } finally {
      setDownloadBusyId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <article
        className="rounded-xl border p-5"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h1 className="text-2xl font-bold uppercase">Participation Certificates</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
          Each event check-in gives you one participation certificate.
        </p>
      </article>

      <article
        className="rounded-xl border p-5"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h2 className="text-xl font-bold uppercase">Certificate Name</h2>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.85)" }}>
          {effectiveName}
        </p>
        <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.72)" }}>
          {nameLocked
            ? "This is your final certificate name."
            : "Please confirm this once before downloading certificates."}
        </p>
        {state.error ? (
          <p className="mt-2 text-sm" style={{ color: "#ff8c7a" }}>
            {state.error}
          </p>
        ) : null}
      </article>

      <article
        className="rounded-xl border p-5"
        style={{ borderColor: "rgba(212, 165, 116, 0.2)", background: "rgba(42, 31, 26, 0.42)" }}
      >
        <h2 className="text-xl font-bold uppercase">Your Certificates</h2>
        {(certificates ?? []).length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "rgba(245, 230, 211, 0.75)" }}>
            No participation certificates available yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr style={{ color: "rgba(245, 230, 211, 0.72)" }}>
                  <th className="py-2">Event</th>
                  <th className="py-2">Check-In Time</th>
                  <th className="py-2">Download</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((row) => {
                  const busy = downloadBusyId === row.checkinId;
                  return (
                    <tr key={row.checkinId} className="border-t" style={{ borderColor: "rgba(212, 165, 116, 0.14)" }}>
                      <td className="py-2">{row.eventName}</td>
                      <td className="py-2">
                        {new Date(row.checkedInAt).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(row.checkinId)}
                          disabled={busy || downloadBusyId !== null || !nameLocked}
                          className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                          style={{
                            borderColor: "rgba(212, 165, 116, 0.3)",
                            color: "rgba(245, 230, 211, 0.95)",
                            opacity: busy || !nameLocked ? 0.75 : 1,
                          }}
                        >
                          {busy ? "Generating..." : "Download"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {downloadError ? (
          <p className="mt-3 text-sm" style={{ color: "#ff8c7a" }}>
            {downloadError}
          </p>
        ) : null}
      </article>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-lg rounded-xl border p-5"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)", background: "rgba(24, 16, 13, 0.98)" }}
          >
            {mode === "review" ? (
              <>
                <h3 className="text-lg font-bold uppercase">Name on certificate</h3>
                <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                  This is the name that will appear on your certificate:
                </p>
                <p className="mt-3 rounded-md border px-3 py-2 text-base" style={{ borderColor: "rgba(212, 165, 116, 0.3)" }}>
                  {effectiveName}
                </p>

                {confirmingFinal ? (
                  <div className="mt-4 rounded-md border p-3" style={{ borderColor: "rgba(212, 165, 116, 0.35)", background: "rgba(10, 4, 8, 0.22)" }}>
                    <p className="text-sm font-semibold">Are you sure?</p>
                    <p className="mt-1 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                      This will be the final name on your certificate. You cannot change it again.
                    </p>
                    <form action={formAction} className="mt-3 flex items-center gap-2">
                      <input type="hidden" name="fullName" value={effectiveName} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                        style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                      >
                        {isPending ? "Updating..." : "Confirm Final Name"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setConfirmingFinal(false)}
                        className="rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                        style={{ borderColor: "rgba(212, 165, 116, 0.3)", color: "rgba(245, 230, 211, 0.9)" }}
                      >
                        Back
                      </button>
                    </form>
                  </div>
                ) : null}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setConfirmingFinal(false);
                      setMode("change");
                    }}
                    className="rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                    style={{ borderColor: "rgba(212, 165, 116, 0.3)", color: "rgba(245, 230, 211, 0.92)" }}
                  >
                    Change Name
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setConfirmingFinal(true)}
                    className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                    style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                  >
                    Confirm Name
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold uppercase">Enter Certificate Name</h3>
                <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
                  This will be final once confirmed.
                </p>
                <form action={formAction} className="mt-4 space-y-3">
                  <input
                    name="fullName"
                    required
                    defaultValue={effectiveName}
                    disabled={isPending}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                      style={{ background: "var(--savara-gold)", color: "#0a0408" }}
                    >
                      {isPending ? "Updating..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setMode("review");
                        setConfirmingFinal(false);
                      }}
                      className="rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                      style={{ borderColor: "rgba(212, 165, 116, 0.3)", color: "rgba(245, 230, 211, 0.9)" }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              </>
            )}

            {state.error ? (
              <p className="mt-3 text-sm" style={{ color: "#ff8c7a" }}>
                {state.error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {downloadBusyId !== null ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-md rounded-xl border p-5 text-center"
            style={{ borderColor: "rgba(212, 165, 116, 0.3)", background: "rgba(24, 16, 13, 0.98)" }}
          >
            <p className="text-lg font-bold uppercase">Your certificate is being generated</p>
            <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.78)" }}>
              Please wait while we prepare your download.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
