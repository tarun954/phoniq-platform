import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import Reveal from "@/components/marketing/Reveal";
import TypingText from "@/components/marketing/TypingText";
import ProductVisual from "@/components/marketing/ProductVisual";

const services = [
  ["AI Voice Receptionist", "Answers calls, understands intent, captures customer details, and creates CRM leads automatically."],
  ["Lead Management", "Hot-lead scoring, status workflow, assignment, follow-up, resolved history, and recovery."],
  ["Appointments", "Capture preferred times, schedule service, assign work, and keep appointment activity connected."],
  ["Customer Conversations", "Bring voice, WhatsApp, SMS, and future email activity into one customer timeline."],
  ["Team Operations", "Owner, Admin, Dispatcher, Technician, and Viewer roles for service-company workflows."],
  ["Analytics", "Track lead flow, response speed, appointments, conversion, completed work, and team activity."],
];

const plans = [
  {
    name: "Starter",
    price: "$199",
    description: "For small service teams starting with AI lead capture.",
    features: ["1 AI phone line", "CRM lead capture", "Lead workflow", "Basic dashboard", "Email support"],
  },
  {
    name: "Growth",
    price: "$499",
    description: "For teams that want automation, assignments, and customer messaging.",
    popular: true,
    features: ["Everything in Starter", "Hot lead alerts", "Team roles", "Appointments", "WhatsApp confirmations", "Follow-up automation"],
  },
  {
    name: "Scale",
    price: "Custom",
    description: "For multi-location and higher-volume service businesses.",
    features: ["Multiple locations", "Advanced permissions", "Custom integrations", "Priority support", "Reporting", "Implementation support"],
  },
];

export default function HomePage() {
  return (
    <div className="marketing-shell min-h-screen bg-white text-slate-900">
      <PublicNav />

      <section className="marketing-grid relative overflow-hidden">
        <div className="mx-auto grid min-h-[740px] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-blue-700">
              AI SERVICE OPERATIONS FOR LOCAL BUSINESSES
            </div>

            <h1 className="mt-6 max-w-2xl text-[46px] font-[850] leading-[1.02] tracking-[-.055em] text-slate-950 sm:text-[62px]">
              Turn every customer conversation into revenue.
            </h1>

            <div className="mt-5 min-h-[42px] text-xl font-extrabold sm:text-2xl">
              Phoniq helps you <TypingText />
            </div>

            <p className="mt-6 max-w-xl text-[16px] leading-8 text-slate-600">
              One AI-powered workspace for phone calls, lead capture, hot-lead alerts,
              appointments, customer follow-up, team operations, and service conversion.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="phoniq-button-primary !min-h-[50px] !px-6">
                Start with Phoniq
              </Link>
              <a href="#how-it-works" className="phoniq-button-secondary !min-h-[50px] !px-6">
                See how it works
              </a>
            </div>
          </div>

          <ProductVisual />
        </div>
      </section>

      <section id="services" className="bg-[#f7f9fc] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-blue-600">
                Services
              </div>
              <h2 className="mt-4 text-4xl font-[850] tracking-[-.045em] text-slate-950">
                Built around the full service-request lifecycle.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Phoniq connects the first customer call to the team that follows up,
                schedules, performs, and resolves the job.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map(([title, description], index) => (
              <Reveal key={title}>
                <div className="h-full rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,.045)] transition hover:-translate-y-1">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="grid gap-5 lg:grid-cols-4">
              {[
                ["01", "Customer contacts you", "Phoniq answers and understands what the customer needs."],
                ["02", "AI captures the lead", "Customer, issue, urgency, address, and preferred time are saved."],
                ["03", "Your team converts it", "Assign, follow up, schedule, and manage the service request."],
                ["04", "Service is resolved", "Completed work stays connected to the customer history."],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-[22px] border border-slate-200 bg-white p-6">
                  <div className="text-xs font-extrabold text-blue-600">{number}</div>
                  <div className="mt-3 text-base font-extrabold text-slate-950">{title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-blue-400">
                Subscription plans
              </div>
              <h2 className="mt-4 text-4xl font-[850] tracking-[-.045em]">
                Start small. Scale the operation.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-400">
                These public prices are placeholders and can be changed before launch.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <Reveal key={plan.name}>
                <div className={`relative h-full rounded-[24px] border p-7 ${
                  plan.popular ? "border-blue-500 bg-blue-600/10" : "border-white/10 bg-white/[.04]"
                }`}>
                  {plan.popular && (
                    <div className="absolute right-5 top-5 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-extrabold">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-lg font-extrabold">{plan.name}</div>
                  <div className="mt-5 text-4xl font-[850]">
                    {plan.price}
                    {plan.price.startsWith("$") && <span className="text-sm text-slate-400"> /mo</span>}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-400">{plan.description}</p>
                  <div className="mt-6 space-y-3 text-sm text-slate-300">
                    {plan.features.map((feature) => <div key={feature}>✓ {feature}</div>)}
                  </div>
                  <Link
                    href="/signup"
                    className={`mt-8 w-full ${plan.popular ? "phoniq-button-primary" : "phoniq-button-secondary"}`}
                  >
                    Choose {plan.name}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 sm:p-12">
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-blue-600">
                About Phoniq
              </div>
              <h2 className="mt-4 max-w-3xl text-4xl font-[850] tracking-[-.045em] text-slate-950">
                AI should fit the way service companies already work.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                Phoniq is an operations layer for service businesses: answer customers faster,
                avoid losing high-intent calls, give teams one CRM, and make follow-up easier.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:justify-between lg:px-8">
          <div>© 2026 Phoniq. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
