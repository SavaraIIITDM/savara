import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/auth/route-helpers";
import { getMyParticipationCertificateByCheckinId } from "@/lib/db/queries";

export const runtime = "nodejs";
const GENERATED_CERTS_DIR = path.join(process.cwd(), "pcerts");

function getFriendlyFileName(checkinId: number) {
  const suffix = String(checkinId).slice(-6);
  return `savara_participation_${suffix}.png`;
}

function runGenerator(name: string, eventName: string, checkinId: number) {
  return new Promise<void>((resolve, reject) => {
    const command = spawn(
      "venv/bin/python3",
      [
        "scripts/generate_pcertificate.py",
        "--config",
        "pcert_config.json",
        "--name",
        name,
        "--event",
        eventName,
        "--file-name",
        String(checkinId),
        "--output-dir",
        GENERATED_CERTS_DIR,
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stderr = "";
    command.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    command.on("error", (error) => {
      reject(error);
    });

    command.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || "Certificate generation failed."));
    });
  });
}

export async function GET(request: Request) {
  const access = await requireAuthenticatedRequest(request);
  if (access.error) {
    return access.error;
  }

  const { searchParams } = new URL(request.url);
  const checkinIdRaw = searchParams.get("checkinId") ?? "";
  const checkinId = Number.parseInt(checkinIdRaw, 10);
  if (!Number.isInteger(checkinId) || checkinId <= 0) {
    return NextResponse.json({ error: "Invalid check-in id." }, { status: 400 });
  }

  const row = await getMyParticipationCertificateByCheckinId(access.user.id, checkinId);
  if (!row) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  if (!row.has_changed_certificate_name) {
    return NextResponse.json(
      { error: "Please confirm your certificate name before downloading." },
      { status: 403 },
    );
  }

  const outputPath = path.join(GENERATED_CERTS_DIR, `${checkinId}.png`);

  try {
    await fs.access(outputPath);
  } catch {
    const participantName = (row.participant_name ?? "Participant").trim() || "Participant";
    try {
      await runGenerator(participantName, row.event_name, checkinId);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Certificate generation failed.",
        },
        { status: 500 },
      );
    }
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(outputPath);
  } catch {
    return NextResponse.json({ error: "Unable to read generated certificate." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${getFriendlyFileName(checkinId)}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
