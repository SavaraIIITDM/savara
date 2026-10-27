import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardRole, type DashboardRole } from "@/lib/auth/roles";
import { isDisabledRoute } from "@/lib/site-release";

export async function requireDashboardUser() {
  // Server actions must also be disabled, even when posted to another URL.
  if (isDisabledRoute("/dashboard")) redirect("/");

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  return user;
}

export async function requireDashboardRole() {
  await requireDashboardUser();
  const role = await getDashboardRole();
  if (!role) {
    redirect("/auth/login?next=/dashboard");
  }

  return role;
}

export async function requireVolunteerOrAdmin() {
  const role = await requireDashboardRole();
  if (!role.isVolunteer && !role.isAdmin) {
    redirect("/dashboard?error=forbidden");
  }
  return role;
}

export async function requireEventVolunteerOrAdmin() {
  const role = await requireDashboardRole();
  if (!role.isAdmin && !role.isVolunteer && !role.isEventVolunteer) {
    redirect("/dashboard?error=forbidden");
  }
  return role;
}

export async function requirePerkVolunteerOrAdmin() {
  const role = await requireDashboardRole();
  if (!role.isAdmin && !role.isVolunteer && !role.isPerkVolunteer) {
    redirect("/dashboard?error=forbidden");
  }
  return role;
}

export async function requireAdmin(): Promise<DashboardRole> {
  const role = await requireDashboardRole();
  if (!role.isAdmin) {
    redirect("/dashboard?error=admin_only");
  }
  return role;
}
