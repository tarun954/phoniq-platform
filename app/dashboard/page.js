import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("organization_members")
      .select(`
        role,
        organization_id,
        organizations (
          id,
          name,
          industry,
          plan,
          status
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

  if (membershipError) {
    console.error("Membership lookup failed:", membershipError);
  }

  if (!membership) {
    redirect("/onboarding");
  }

  const organization = membership.organizations;
  const organizationId = membership.organization_id;

  const [
    leadsResult,
    appointmentsResult,
    callsResult,
    customersResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        `
          id,
          service_issue,
          emergency,
          priority,
          status,
          preferred_time,
          created_at,
          customers (
            full_name,
            phone,
            city,
            service_address
          )
        `
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),

    supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),

    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  const leads = leadsResult.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/" className="text-xl font-bold">
              PHONIQ
            </Link>

            <p className="mt-1 text-sm text-slate-400">
              {organization?.name ?? "Company workspace"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user.email}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {membership.role}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-blue-300">
            COMPANY OVERVIEW
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Operations dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Review leads, calls, customers, and appointment requests.
          </p>
        </div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Recent leads"
            value={leads.length}
            detail="Latest 20 records"
          />

          <MetricCard
            label="Appointments"
            value={appointmentsResult.count ?? 0}
            detail="All appointment requests"
          />

          <MetricCard
            label="Calls"
            value={callsResult.count ?? 0}
            detail="Recorded call events"
          />

          <MetricCard
            label="Customers"
            value={customersResult.count ?? 0}
            detail="Unique customer records"
          />
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold">
                Recent leads
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Leads created by phone, website, or staff.
              </p>
            </div>
          </div>

          {leadsResult.error ? (
            <div className="p-6 text-red-300">
              Unable to load leads: {leadsResult.error.message}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <TableHeading>Customer</TableHeading>
                    <TableHeading>Issue</TableHeading>
                    <TableHeading>Priority</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading>Requested time</TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {leads.map((lead) => {
                    const customer = Array.isArray(lead.customers)
                      ? lead.customers[0]
                      : lead.customers;

                    return (
                      <tr key={lead.id} className="hover:bg-white/[0.03]">
                        <TableCell>
                          <p className="font-medium">
                            {customer?.full_name || "Unknown customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer?.phone || "No phone"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-xs">
                            {lead.service_issue}
                          </p>
                        </TableCell>

                        <TableCell>
                          <StatusBadge value={lead.priority} />
                        </TableCell>

                        <TableCell>
                          <StatusBadge value={lead.status} />
                        </TableCell>

                        <TableCell>
                          {lead.preferred_time || "Not provided"}
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
        ☎
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        No Phoniq leads yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Once the Telnyx assistant calls the Phoniq lead tool,
        customer information will appear here.
      </p>
    </div>
  );
}

function TableHeading({ children }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
      {children}
    </td>
  );
}

function StatusBadge({ value }) {
  const formatted = String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
      {formatted}
    </span>
  );
}