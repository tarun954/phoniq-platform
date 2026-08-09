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
          redirectTo:
            `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) throw error;

      setSuccess(true);
      setMessage(
        "Password reset email sent. Check your inbox and follow the link."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-300"
        >
          PHONIQ
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          Forgot your password?
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Enter your account email and we’ll send you a reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">
              Email address
            </span>

            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="you@company.com"
            />
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-5 rounded-xl p-4 text-sm ${
              success
                ? "bg-green-500/10 text-green-200"
                : "bg-red-500/10 text-red-200"
            }`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}