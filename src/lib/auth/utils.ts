import { randomBytes } from "node:crypto";

export function randomToken(size = 32) {
  return randomBytes(size).toString("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function inferParticipantType(email: string): "internal" | "external" {
  return normalizeEmail(email).endsWith("@iiitdm.ac.in") ? "internal" : "external";
}
