import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/auth/route-helpers";
import {
  deleteTicketWithDependencies,
  getActivationCodeDetails,
  getTicketAndCodesByEmail,
  revokeCodeAndDeleteTickets,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (access.error) {
    return access.error;
  }

  const body = (await request.json()) as {
    action?: string;
    query?: string;
    mode?: "code" | "email";
    ticketId?: string;
    codeId?: string;
  };

  const action = String(body.action ?? "");

  if (action === "search") {
    const mode = body.mode === "email" ? "email" : "code";
    const query = String(body.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "Search value is required." }, { status: 400 });
    }

    if (mode === "code") {
      const data = await getActivationCodeDetails(query);
      if (!data) {
        return NextResponse.json({ result: null });
      }
      return NextResponse.json({ result: data, mode });
    }

    const data = await getTicketAndCodesByEmail(query);
    return NextResponse.json({ result: data, mode });
  }

  if (action === "deleteTicket") {
    const ticketId = String(body.ticketId ?? "").trim();
    if (!ticketId) {
      return NextResponse.json({ error: "Ticket id is required." }, { status: 400 });
    }
    const deleted = await deleteTicketWithDependencies(ticketId);
    return NextResponse.json({ deleted });
  }

  if (action === "revokeCode") {
    const codeId = String(body.codeId ?? "").trim();
    if (!codeId) {
      return NextResponse.json({ error: "Code id is required." }, { status: 400 });
    }
    const result = await revokeCodeAndDeleteTickets(codeId);
    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
