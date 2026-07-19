import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-wide">
            PHONIQ
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
            AI operations for home-service businesses
          </p>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Every customer call becomes an actionable job.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Phoniq answers calls, captures customer information,
            identifies urgent issues, creates leads, and organizes
            appointment requests inside one secure company workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
            >
              Create workspace
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 px-6 py-3 font-semibold hover:bg-white/10"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Incoming service request
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  AC not cooling
                </h2>
              </div>

              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-medium text-orange-300">
                High priority
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Customer" value="Jordan Miller" />
              <InfoCard label="Location" value="Frisco, Texas" />
              <InfoCard label="Preferred time" value="Tomorrow, 2 PM" />
              <InfoCard label="Source" value="Phoniq Voice AI" />
            </div>

            <div className="mt-5 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-200">
              Appointment request created and ready for dispatcher review.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-100">{value}</p>
    </div>
  );
}