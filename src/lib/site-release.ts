// Keep launch restrictions independent of authentication so existing sessions
// cannot access sections that are not open for the 2027 release.
export const DISABLED_ROUTE_ROOTS = [
  "/dashboard",
  "/auth",
  "/schedule",
  "/events",
  "/accomodation",
  "/accommodation",
  "/tickets",
  "/merch",
] as const;

export function isDisabledRoute(pathname: string) {
  return DISABLED_ROUTE_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export const COUNTDOWN_TARGET_MS = Date.parse("2027-04-01T00:00:00+05:30");

export function getCountdownParts(nowMs: number) {
  const remaining = Math.max(0, COUNTDOWN_TARGET_MS - nowMs);
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
  };
}
