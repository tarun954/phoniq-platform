"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
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

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setMessage(
          "Account created. Check your email to verify your account."
        );
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-blue-300">
          PHONIQ
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Set up your secure company workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <Field
            label="Full name"
            type="text"
            value={form.fullName}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                fullName: value,
              }))
            }
          />

          <Field
            label="Work email"
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

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        minLength={type === "password" ? 10 : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}