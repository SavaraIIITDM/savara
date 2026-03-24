"use client";

import { useActionState, useState } from "react";
import { updateCertificateNameAction } from "@/app/dashboard/actions";

const initialState = {
  error: "",
  success: "",
  updatedName: "",
};

type CertificateNameCardProps = {
  fullName: string;
  hasChangedCertificateName: boolean;
};

export function CertificateNameCard({
  fullName,
  hasChangedCertificateName,
}: CertificateNameCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const isLocked = hasChangedCertificateName || Boolean(state.success);
  const displayName = state.updatedName || fullName;

  return (
    <article
      className="rounded-xl border p-5"
      style={{
        borderColor: "rgba(212, 165, 116, 0.2)",
        background: "rgba(42, 31, 26, 0.42)",
      }}
    >
      <h2 className="text-xl font-bold uppercase">Name on Certificate</h2>
      <p className="mt-2 text-sm" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        {displayName}
      </p>
      <p
        className="mt-3 text-sm"
        style={{ color: "rgba(245, 230, 211, 0.78)" }}
      >
        {isLocked
          ? "You have already used your one-time name change."
          : "This is the name that will appear in your participation certificate. You are allowed to change it once, if this is not your real name."}
      </p>

      {!isLocked && (
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="mt-4 rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
          style={{ background: "var(--savara-gold)", color: "#0a0408" }}
        >
          Update Name
        </button>
      )}
      {state.success && (
        <p className="mt-3 text-sm" style={{ color: "#a6e7b2" }}>
          {state.success}
        </p>
      )}

      {isDialogOpen && !state.success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-md rounded-xl border p-5"
            style={{
              borderColor: "rgba(212, 165, 116, 0.3)",
              background: "rgba(24, 16, 13, 0.98)",
            }}
          >
            <h3 className="text-lg font-bold uppercase">
              Update Certificate Name
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(245, 230, 211, 0.78)" }}
            >
              Note: you can only change it once.
            </p>

            <form action={formAction} className="mt-4 space-y-3">
              <input
                name="fullName"
                required
                defaultValue={displayName}
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
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
                  style={{
                    borderColor: "rgba(212, 165, 116, 0.3)",
                    color: "rgba(245, 230, 211, 0.9)",
                  }}
                >
                  Cancel
                </button>
              </div>

              {state.error && (
                <p className="text-sm" style={{ color: "#ff8c7a" }}>
                  {state.error}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
