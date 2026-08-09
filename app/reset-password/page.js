"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (password.length < 10) {
      setMessage(
        "Password must contain at least 10 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) throw error;

      await supabase.auth.signOut();

      router.push("/login?passwordReset=success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
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

        <h1 className="mt-3 text-3xl font-bold">
          Create a new password
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Enter and confirm your new password.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <input
            required
            type="password"
            minLength={10}
            placeholder="New password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <input
            required
            type="password"
            minLength={10}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold"
          >
            {loading
              ? "Updating password..."
              : "Update password"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}