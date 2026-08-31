"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
          },
        },
      });

      if (error) throw error;

      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      setError(error?.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="phoniq-card p-7 sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-600 font-extrabold text-white">
              P
            </div>
            <span className="text-lg font-extrabold text-slate-950">PHONIQ</span>
          </Link>

          <div className="mt-9 text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
            Create workspace
          </div>

          <h1 className="mt-3 text-4xl font-[850] tracking-[-.045em] text-slate-950">
            Start your Phoniq account
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Create your login first. The next screen will configure your
            company, AI agent, service workflow, and website chat.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold text-slate-700">
                Full name
              </span>
              <input
                required
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                className="phoniq-input"
                placeholder="Your full name"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold text-slate-700">
                Work email
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                className="phoniq-input"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-700">
                Password
              </span>
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) => setField("password", event.target.value)}
                className="phoniq-input"
                placeholder="8+ characters"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-700">
                Confirm password
              </span>
              <input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                className="phoniq-input"
                placeholder="Repeat password"
              />
            </label>

            {error && (
              <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="phoniq-button-primary sm:col-span-2 w-full !min-h-[48px] !text-white "
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-7 rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
            Already have a Phoniq account?{" "}
            <Link href="/login" className="font-extrabold text-blue-600">
              Sign in
            </Link>
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="rounded-[30px] bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white shadow-2xl">
            <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-blue-100">
              Setup takes minutes
            </div>
            <h2 className="mt-5 text-4xl font-[850] tracking-[-.045em]">
              Build your AI front desk and CRM around your business.
            </h2>
            <div className="mt-7 space-y-4 text-sm text-blue-50">
              <div>✓ Add company and service-area information</div>
              <div>✓ Configure AI greeting and escalation preferences</div>
              <div>✓ Set notification and WhatsApp preferences</div>
              <div>✓ Generate a website chat widget for lead capture</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
