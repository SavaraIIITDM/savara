import { signInWithGoogle } from "@/app/auth/login/actions";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-20">
      <section
        className="w-full rounded-xl border p-6 sm:p-8"
        style={{
          background: "rgba(42, 31, 26, 0.65)",
          borderColor: "rgba(212, 165, 116, 0.22)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "rgba(245, 230, 211, 0.65)" }}
        >
          Sign In
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase">Dashboard Access</h1>
        <p className="mt-3 text-base" style={{ color: "rgba(245, 230, 211, 0.8)" }}>
          Continue with Google to access your ticket, event participation, and check-in tools.
        </p>

        <div
          className="mt-4 rounded-md border px-4 py-3"
          style={{
            borderColor: "rgba(212, 165, 116, 0.4)",
            background: "rgba(10, 4, 8, 0.4)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "rgba(245, 230, 211, 0.78)" }}
          >
            Important for IIITDM Students
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "rgba(245, 230, 211, 0.95)" }}>
            If you are from IIITDM Kancheepuram, please use your institute email.
          </p>
        </div>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signInWithGoogle(nextPath);
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors"
            style={{
              background: "var(--savara-gold)",
              color: "#0a0408",
            }}
          >
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
