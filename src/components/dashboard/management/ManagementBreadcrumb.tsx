import Link from "next/link";

export function ManagementBreadcrumb({ section }: { section: string }) {
  return (
    <nav className="mb-4 text-sm" aria-label="Breadcrumb">
      <Link href="/dashboard/admin/management" className="underline" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
        Management
      </Link>
      <span className="mx-2" style={{ color: "rgba(245, 230, 211, 0.6)" }}>
        /
      </span>
      <span style={{ color: "rgba(245, 230, 211, 0.9)" }}>{section}</span>
    </nav>
  );
}
