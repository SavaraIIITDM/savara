/**
 * bulk-send-internal.ts
 *
 * Bulk-processes internal participants from a CSV and:
 *   1. Checks if the email already has an activation code → skips if so
 *   2. Calls verifyPurchase() to generate a code + auto-assign ticket if profile exists
 *   3. Sends the activation-code email via Nodemailer (run from localhost, not the VPS)
 *
 * Usage:
 *   npx tsx scripts/bulk-send-internal.ts --csv path/to/participants.csv [--dry-run]
 *
 * Required env vars (in .env.local or exported):
 *   DATABASE_URL      — your Postgres connection string
 *   GMAIL_USER        — fest Gmail address
 *   GMAIL_APP_PASSWORD
 *   ACTOR_USER_ID     — admin user ID to attribute the codes to
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

// ─── adjust these import paths to match your project layout ───────────────────
import { verifyPurchase } from "@/lib/db/queries";
import { getDb } from "@/lib/db/client";
import { activationCodes } from "@/lib/db/schema";
// ─────────────────────────────────────────────────────────────────────────────

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const csvFlagIdx = args.indexOf("--csv");
const DRY_RUN = args.includes("--dry-run");

if (csvFlagIdx === -1 || !args[csvFlagIdx + 1]) {
  console.error(
    "Usage: npx tsx scripts/bulk-send-internal.ts --csv <file> [--dry-run]",
  );
  process.exit(1);
}

const CSV_PATH = path.resolve(args[csvFlagIdx + 1]);

// ── env validation ────────────────────────────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ACTOR_USER_ID = process.env.ACTOR_USER_ID;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error("❌  GMAIL_USER or GMAIL_APP_PASSWORD not set.");
  process.exit(1);
}
if (!ACTOR_USER_ID) {
  console.error("❌  ACTOR_USER_ID not set.");
  process.exit(1);
}

// ── mailer (localhost — port 587 is not blocked here) ────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
});

// ── CSV row shape ─────────────────────────────────────────────────────────────
interface CsvRow {
  sno: string;
  name: string;
  rollnumber: string;
  email: string;
  n_tickets: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildEmailHtml(params: {
  activationCode: string;
  ticketCount: number;
  name: string;
}) {
  const dashboardUrl = "https://savara.in/dashboard";
  return {
    text: `Hi ${params.name}, your Savara 2026 activation code is ${params.activationCode}. Valid for ${params.ticketCount} user(s). Redeem at: ${dashboardUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin-bottom: 8px;">Your Savara 2026 Ticket Activation Code</h2>
        <p style="margin: 0 0 10px;">Hi ${params.name}, thank you for being part of Savara 2026!</p>
        <p style="margin: 0 0 10px;">Enter this code in the savara.in dashboard to activate your ticket.</p>
        <p style="margin: 0 0 4px;"><strong>Activation code:</strong> ${params.activationCode}</p>
        <p style="margin: 0 0 16px;"><strong>Code is valid for</strong> ${params.ticketCount} user${params.ticketCount > 1 ? "s" : ""}.</p>
        <p style="margin: 0 0 16px;">
          To get your ticket, enter this code in the dashboard below.
          ${params.ticketCount > 1 ? "You can share this code with your friends to redeem." : ""}
        </p>
        <a
          href="${dashboardUrl}"
          style="display:inline-block;background:#d4a574;color:#0a0408;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600;"
        >
          Dashboard to Redeem Code
        </a>
      </div>
    `,
  };
}

async function alreadyHasCode(email: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ code: activationCodes.code })
    .from(activationCodes)
    .where(eq(activationCodes.purchaserEmail, normalizeEmail(email)))
    .limit(1);
  return rows[0]?.code ?? null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── result tracking ───────────────────────────────────────────────────────────
interface RowResult {
  sno: string;
  email: string;
  status: "skipped" | "dry-run" | "ok" | "error";
  code?: string;
  ticketAssigned?: boolean;
  reason?: string;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8");

  // The CSV has a leading unnamed column (the blank first column before sno).
  // csv-parse with columns:true will name it "" — we just ignore it.
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`\n📋  Loaded ${rows.length} rows from ${CSV_PATH}`);
  if (DRY_RUN)
    console.log("🧪  DRY RUN — no DB writes or emails will be sent\n");

  const results: RowResult[] = [];
  let skipped = 0,
    succeeded = 0,
    failed = 0;

  for (const row of rows) {
    const email = normalizeEmail(row.email ?? "");
    const name = (row.name ?? "").trim();
    const ticketCount = parseInt(row.n_tickets ?? "1", 10);
    const sno = row.sno;

    // ── validate row ──────────────────────────────────────────────────────────
    if (!email || !email.includes("@")) {
      const r: RowResult = {
        sno,
        email,
        status: "error",
        reason: "Invalid email",
      };
      results.push(r);
      console.warn(`  [${sno}] ⚠️  SKIP — invalid email: "${email}"`);
      failed++;
      continue;
    }
    if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 10) {
      const r: RowResult = {
        sno,
        email,
        status: "error",
        reason: `Invalid ticket count: ${ticketCount}`,
      };
      results.push(r);
      console.warn(
        `  [${sno}] ⚠️  SKIP — invalid n_tickets for ${email}: ${row.n_tickets}`,
      );
      failed++;
      continue;
    }

    // ── check for existing code ───────────────────────────────────────────────
    if (!DRY_RUN) {
      const existing = await alreadyHasCode(email);
      if (existing) {
        const r: RowResult = {
          sno,
          email,
          status: "skipped",
          code: existing,
          reason: "Already has activation code",
        };
        results.push(r);
        console.log(
          `  [${sno}] ⏭️  SKIP — ${email} already has code ${existing}`,
        );
        skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      results.push({
        sno,
        email,
        status: "dry-run",
        reason: `Would create code for ${ticketCount} ticket(s)`,
      });
      console.log(
        `  [${sno}] 🧪  DRY-RUN — ${email} (${name}), ${ticketCount} ticket(s)`,
      );
      continue;
    }

    // ── verifyPurchase ────────────────────────────────────────────────────────
    let code: string;
    let ticketAssigned: boolean;
    try {
      const result = await verifyPurchase({
        purchaserEmail: email,
        ticketCount,
        purchaseType: "internal",
        actorUserId: ACTOR_USER_ID!,
      });
      code = result.code;
      ticketAssigned = result.ticket_assigned;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      results.push({
        sno,
        email,
        status: "error",
        reason: `verifyPurchase failed: ${reason}`,
      });
      console.error(`  [${sno}] ❌  ERROR — ${email}: ${reason}`);
      failed++;
      continue;
    }

    // ── send email ────────────────────────────────────────────────────────────
    const { text, html } = buildEmailHtml({
      activationCode: code,
      ticketCount,
      name,
    });
    try {
      await transporter.sendMail({
        from: `"IIITDM Fest" <${GMAIL_USER}>`,
        to: email,
        subject: "Savara 2026 Ticket Activation Code",
        text,
        html,
      });
      console.log(
        `  [${sno}] ✅  OK — ${email} → code ${code}${ticketAssigned ? " (ticket auto-assigned)" : ""}`,
      );
      results.push({ sno, email, status: "ok", code, ticketAssigned });
      succeeded++;
    } catch (emailErr) {
      const reason =
        emailErr instanceof Error ? emailErr.message : String(emailErr);
      // Code was created — log it prominently so it's not lost
      console.error(
        `  [${sno}] ⚠️  EMAIL FAILED — ${email}, code ${code} was created. Reason: ${reason}`,
      );
      results.push({
        sno,
        email,
        status: "error",
        code,
        reason: `Email failed: ${reason}`,
      });
      failed++;
    }

    // Avoid hammering Gmail SMTP — 300ms between sends
    await sleep(300);
  }

  // ── summary ───────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary
  Total rows : ${rows.length}
  ✅ Succeeded: ${succeeded}
  ⏭️  Skipped  : ${skipped}
  ❌ Failed   : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Write a results log next to the CSV
  const logPath =
    CSV_PATH.replace(/\.csv$/i, "") + `-results-${Date.now()}.json`;
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  console.log(`\n📄  Full results written to: ${logPath}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
