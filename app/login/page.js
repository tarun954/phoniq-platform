"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

      if (error) {
        throw error;
      }

      const nextPath = searchParams.get("next");
      const safePath =
        nextPath?.startsWith("/") &&
        !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";

      router.push(safePath);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <Link href="/" className="text-sm font-semibold text-blue-300">
          PHONIQ
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          Sign in to your workspace
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Access your calls, leads, and appointment requests.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                email: value,
              }))
            }
          />

          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                password: value,
              }))
            }
          />
          <div className="flex justify-end">
  <Link
    href="/forgot-password"
    className="text-sm text-blue-300 hover:text-blue-200"
  >
    Forgot password?
  </Link>
</div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          
        </form>

        {message && (
          <p className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Need a workspace?{" "}
          <Link href="/signup" className="text-blue-300 hover:text-blue-200">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      Loading…
    </main>
  );
}