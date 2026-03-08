"use client";

import { useActionState } from "react";
import { verifyPurchaseAction } from "@/app/dashboard/admin/purchases/actions";

const initialState = {
  error: "",
  success: "",
};

export function AdminVerifyPurchaseForm() {
  const [state, formAction, isPending] = useActionState(
    async (_state: typeof initialState, formData: FormData) => {
      const result = await verifyPurchaseAction(formData);
      return {
        error: result.error ?? "",
        success: result.success ?? "",
      };
    },
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <div>
        <label className="block text-sm font-medium" htmlFor="purchaserEmail">
          Purchaser Email
        </label>
        <input
          id="purchaserEmail"
          name="purchaserEmail"
          type="email"
          required
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="ticketCount">
          Number of Tickets
        </label>
        <input
          id="ticketCount"
          name="ticketCount"
          type="number"
          min={1}
          max={10}
          required
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="purchaseType">
          Purchase Type
        </label>
        <select
          id="purchaseType"
          name="purchaseType"
          defaultValue="external"
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "rgba(212, 165, 116, 0.28)" }}
        >
          <option value="external" style={{ color: "#0a0408" }}>
            External
          </option>
          <option value="internal" style={{ color: "#0a0408" }}>
            Internal
          </option>
        </select>
      </div>

      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notifyByEmail"
          className="h-4 w-4 rounded border"
          style={{ borderColor: "rgba(212, 165, 116, 0.4)" }}
        />
        Notify via email
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em]"
        style={{ background: "var(--savara-gold)", color: "#0a0408" }}
      >
        {isPending ? "Verifying..." : "Verify Purchase"}
      </button>

      {state.error && (
        <p className="text-sm" style={{ color: "#ff8c7a" }}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm" style={{ color: "#a6e7b2" }}>
          {state.success}
        </p>
      )}
    </form>
  );
}
