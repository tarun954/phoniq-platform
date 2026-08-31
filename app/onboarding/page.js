"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const serviceOptions = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Cleaning",
  "Landscaping",
  "Appliance Repair",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    businessType: "HVAC",
    website: "",
    mainPhone: "",
    serviceArea: "",
    timezone: "America/Chicago",
    teamSize: "1-5",
    primaryContactName: "",
    primaryContactPhone: "",
    notificationEmail: "",
    services: ["HVAC"],
    emergencyPolicy: "",
    aiAgentName: "Phoniq AI",
    aiGreeting:
      "Hello! Thank you for calling. I'm your AI service assistant. How can I help you today?",
    whatsappEnabled: true,
    businessHours: {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "Closed",
      sunday: "Closed",
    },
  });

  function setField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleService(service) {
    setForm((current) => {
      const exists = current.services.includes(service);

      return {
        ...current,
        services: exists
          ? current.services.filter((item) => item !== service)
          : [...current.services, service],
      };
    });
  }

  const progress = useMemo(() => `${(step / 4) * 100}%`, [step]);

  async function submit() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to complete onboarding.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-600 font-extrabold text-white">
              P
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-950">PHONIQ</div>
              <div className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                Company Setup
              </div>
            </div>
          </div>

          <div className="text-xs font-extrabold text-slate-500">
            Step {step} of 4
          </div>
        </div>

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: progress }}
          />
        </div>

        <section className="phoniq-card mt-6 p-6 sm:p-8">
          {step === 1 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
                Company
              </div>
              <h1 className="mt-3 text-3xl font-[850] tracking-[-.04em] text-slate-950">
                Tell us about the business
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                This information is used to identify the workspace, service area,
                and how Phoniq should represent the company.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Company name">
                  <input
                    required
                    className="phoniq-input"
                    value={form.companyName}
                    onChange={(event) => setField("companyName", event.target.value)}
                    placeholder="ABC Heating & Air"
                  />
                </Field>

                <Field label="Business type">
                  <select
                    className="phoniq-input"
                    value={form.businessType}
                    onChange={(event) => setField("businessType", event.target.value)}
                  >
                    {serviceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Website">
                  <input
                    className="phoniq-input"
                    value={form.website}
                    onChange={(event) => setField("website", event.target.value)}
                    placeholder="https://company.com"
                  />
                </Field>

                <Field label="Main business phone">
                  <input
                    className="phoniq-input"
                    value={form.mainPhone}
                    onChange={(event) => setField("mainPhone", event.target.value)}
                    placeholder="+1 972 ..."
                  />
                </Field>

                <Field label="Primary service area">
                  <input
                    className="phoniq-input"
                    value={form.serviceArea}
                    onChange={(event) => setField("serviceArea", event.target.value)}
                    placeholder="Dallas–Fort Worth, TX"
                  />
                </Field>

                <Field label="Team size">
                  <select
                    className="phoniq-input"
                    value={form.teamSize}
                    onChange={(event) => setField("teamSize", event.target.value)}
                  >
                    <option>1-5</option>
                    <option>6-15</option>
                    <option>16-50</option>
                    <option>51-100</option>
                    <option>100+</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
                Services & Contact
              </div>
              <h1 className="mt-3 text-3xl font-[850] tracking-[-.04em] text-slate-950">
                What should Phoniq handle?
              </h1>

              <div className="mt-7">
                <div className="text-xs font-extrabold text-slate-700">
                  Services offered
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceOptions.map((service) => {
                    const active = form.services.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                          active
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field label="Primary contact name">
                  <input
                    className="phoniq-input"
                    value={form.primaryContactName}
                    onChange={(event) => setField("primaryContactName", event.target.value)}
                    placeholder="Operations manager"
                  />
                </Field>

                <Field label="Primary contact phone">
                  <input
                    className="phoniq-input"
                    value={form.primaryContactPhone}
                    onChange={(event) => setField("primaryContactPhone", event.target.value)}
                    placeholder="+1 ..."
                  />
                </Field>

                <Field label="Notification email">
                  <input
                    type="email"
                    className="phoniq-input"
                    value={form.notificationEmail}
                    onChange={(event) => setField("notificationEmail", event.target.value)}
                    placeholder="dispatch@company.com"
                  />
                </Field>

                <Field label="Timezone">
                  <select
                    className="phoniq-input"
                    value={form.timezone}
                    onChange={(event) => setField("timezone", event.target.value)}
                  >
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
                AI Agent
              </div>
              <h1 className="mt-3 text-3xl font-[850] tracking-[-.04em] text-slate-950">
                Configure the customer experience
              </h1>

              <div className="mt-7 grid gap-5">
                <Field label="AI agent name">
                  <input
                    className="phoniq-input"
                    value={form.aiAgentName}
                    onChange={(event) => setField("aiAgentName", event.target.value)}
                  />
                </Field>

                <Field label="Greeting">
                  <textarea
                    className="phoniq-input !min-h-[110px] py-3"
                    value={form.aiGreeting}
                    onChange={(event) => setField("aiGreeting", event.target.value)}
                  />
                </Field>

                <Field label="Emergency / escalation policy">
                  <textarea
                    className="phoniq-input !min-h-[110px] py-3"
                    value={form.emergencyPolicy}
                    onChange={(event) => setField("emergencyPolicy", event.target.value)}
                    placeholder="Example: gas smell, smoke, fire, carbon monoxide or unsafe electrical conditions must be escalated immediately."
                  />
                </Field>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.whatsappEnabled}
                    onChange={(event) => setField("whatsappEnabled", event.target.checked)}
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-800">
                      Enable WhatsApp appointment messaging
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Used later for confirmations, reminders, and follow-up.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-600">
                Review
              </div>
              <h1 className="mt-3 text-3xl font-[850] tracking-[-.04em] text-slate-950">
                Your workspace is ready to initialize
              </h1>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Summary label="Company" value={form.companyName} />
                <Summary label="Business type" value={form.businessType} />
                <Summary label="Service area" value={form.serviceArea} />
                <Summary label="Team size" value={form.teamSize} />
                <Summary label="AI agent" value={form.aiAgentName} />
                <Summary label="WhatsApp" value={form.whatsappEnabled ? "Enabled" : "Disabled"} />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="text-sm font-extrabold text-blue-900">
                  After setup
                </div>
                <p className="mt-2 text-sm leading-7 text-blue-800">
                  Phoniq will save the company profile and create a website-chat
                  widget configuration for this organization. Your Telnyx phone
                  setup remains unchanged.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={step === 1 || saving}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              className="phoniq-button-secondary disabled:opacity-40"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(4, current + 1))}
                className="phoniq-button-primary !text-white"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="phoniq-button-primary !text-white"
              >
                {saving ? "Creating workspace..." : "Finish setup"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-extrabold text-slate-900">
        {value || "Not provided"}
      </div>
    </div>
  );
}
