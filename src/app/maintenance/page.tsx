export default function MaintenancePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-20">
      <section
        className="w-full rounded-xl border p-8 text-center sm:p-10"
        style={{
          background: "rgba(42, 31, 26, 0.62)",
          borderColor: "rgba(212, 165, 116, 0.22)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "rgba(245, 230, 211, 0.66)" }}
        >
          Maintenance
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase sm:text-5xl">We&apos;ll be back</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base" style={{ color: "rgba(245, 230, 211, 0.82)" }}>
          We are updating the website. Please check back later!
        </p>
      </section>
    </main>
  );
}
