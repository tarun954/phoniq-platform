"use client";

import { useEffect, useState } from "react";

const DAYS = [
  { weekday: 1, name: "Monday" },
  { weekday: 2, name: "Tuesday" },
  { weekday: 3, name: "Wednesday" },
  { weekday: 4, name: "Thursday" },
  { weekday: 5, name: "Friday" },
  { weekday: 6, name: "Saturday" },
  { weekday: 0, name: "Sunday" },
];

function createDefaultDays() {
  return DAYS.map((day) => ({
    ...day,
    enabled: day.weekday >= 1 && day.weekday <= 5,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 60,
  }));
}

export default function AvailabilitySettings() {
  const [days, setDays] = useState(createDefaultDays());
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings/availability", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load availability.");
      }

      setCanEdit(Boolean(result.canEdit));

      const rows = Array.isArray(result.availability)
        ? result.availability
        : [];

      setDays(
        DAYS.map((day) => {
          const existing = rows.find(
            (row) => Number(row.weekday) === day.weekday
          );

          return {
            ...day,
            enabled:
              existing?.enabled ??
              (day.weekday >= 1 && day.weekday <= 5),
            startTime: existing?.start_time?.slice(0, 5) || "09:00",
            endTime: existing?.end_time?.slice(0, 5) || "17:00",
            slotMinutes: Number(existing?.slot_minutes) || 60,
          };
        })
      );
    } catch (err) {
      setError(err?.message || "Unable to load availability.");
    } finally {
      setLoading(false);
    }
  }

  function updateDay(weekday, field, value) {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday
          ? { ...day, [field]: value }
          : day
      )
    );

    setSuccess("");
  }

  async function saveAvailability() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      for (const day of days) {
        if (day.enabled && day.startTime >= day.endTime) {
          throw new Error(
            `${day.name}: opening time must be before closing time.`
          );
        }
      }

      const response = await fetch("/api/settings/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days: days.map((day) => ({
            weekday: day.weekday,
            enabled: day.enabled,
            startTime: day.startTime,
            endTime: day.endTime,
            slotMinutes: day.slotMinutes,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save availability.");
      }

      setSuccess("Business hours saved successfully.");
    } catch (err) {
      setError(err?.message || "Unable to save availability.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">
          Loading business hours...
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Business Hours & Availability
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Configure when customers can request service appointments.
        </p>

        {!canEdit && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            Read-only access. Only Owner/Admin can update business hours.
          </p>
        )}
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        {days.map((day) => (
          <div
            key={day.weekday}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-slate-900">
                  {day.name}
                </div>

                <div className="mt-0.5 text-xs text-slate-500">
                  {day.enabled
                    ? "Available for appointments"
                    : "Closed"}
                </div>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() =>
                  updateDay(day.weekday, "enabled", !day.enabled)
                }
                aria-label={`Toggle ${day.name}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  day.enabled ? "bg-blue-600" : "bg-slate-300"
                } ${
                  canEdit
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                    day.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {day.enabled && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Opens
                  </span>

                  <input
                    type="time"
                    disabled={!canEdit}
                    value={day.startTime}
                    onChange={(event) =>
                      updateDay(
                        day.weekday,
                        "startTime",
                        event.target.value
                      )
                    }
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">
                    Closes
                  </span>

                  <input
                    type="time"
                    disabled={!canEdit}
                    value={day.endTime}
                    onChange={(event) =>
                      updateDay(
                        day.weekday,
                        "endTime",
                        event.target.value
                      )
                    }
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-medium text-slate-600">
                    Appointment length
                  </span>

                  <select
                    disabled={!canEdit}
                    value={day.slotMinutes}
                    onChange={(event) =>
                      updateDay(
                        day.weekday,
                        "slotMinutes",
                        Number(event.target.value)
                      )
                    }
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveAvailability}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Business Hours"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
