"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function OnboardingPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("hvac");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const slug = `${createSlug(companyName)}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      const { error } = await supabase.rpc(
        "create_organization",
        {
          organization_name: companyName,
          organization_slug: slug,
          organization_industry: industry,
        }
      );

      if (error) {
        throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create company."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-blue-300">
          PHONIQ SETUP
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Create your company workspace
        </h1>

        <p className="mt-3 text-slate-400">
          Calls, customers, leads and appointments will be
          isolated inside this workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">
              Company name
            </span>

            <input
              required
              minLength={2}
              value={companyName}
              onChange={(event) =>
                setCompanyName(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Atlas Heating & Air"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">
              Industry
            </span>

            <select
              value={industry}
              onChange={(event) =>
                setIndustry(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="hvac">HVAC</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="roofing">Roofing</option>
              <option value="home_services">
                Other home service
              </option>
            </select>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? "Creating workspace..."
              : "Create Phoniq workspace"}
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