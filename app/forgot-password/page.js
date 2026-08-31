"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) throw error;

      setSuccess(true);
      setMessage(
        "Reset link sent. Check your inbox and use the newest Phoniq password-reset email."
      );
    } catch (error) {
      setMessage(error?.message || "Unable to send the reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="phoniq-card p-7 sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-600 font-extrabold text-white">
              P
            </div>
            <span className="text-lg font-extrabold text-slate-950">PHONIQ</span>
          </Link>

          <div className="mt-10 text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
            Account recovery
          </div>

          <h1 className="mt-3 text-4xl font-[850] tracking-[-.045em] text-slate-950">
            Reset your password
          </h1>

          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Enter the email connected to your Phoniq workspace. We will send
            you a secure password-reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-700">
                Account email
              </span>

              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="phoniq-input"
                placeholder="you@company.com"
              />
            </label>

            <button
              disabled={loading}
              className="phoniq-button-primary w-full !min-h-[48px] !text-white"
            >
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
                success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-7 flex items-center justify-between text-sm">
            <Link href="/login" className="font-extrabold text-blue-600">
              ← Back to sign in
            </Link>

            <Link href="/signup" className="font-bold text-slate-600">
              Create account
            </Link>
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="rounded-[30px] bg-slate-950 p-10 text-white shadow-2xl">
            <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-blue-300">
              Secure recovery
            </div>
            <h2 className="mt-5 text-4xl font-[850] tracking-[-.045em]">
              Get back to your service operations without losing your workflow.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Passwords are managed by Supabase Authentication. Phoniq never
              displays your existing password; recovery happens through a secure
              email link.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
