"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = [
  { weekday: 1, name: "Monday" },
  { weekday: 2, name: "Tuesday" },
  { weekday: 3, name: "Wednesday" },
  { weekday: 4, name: "Thursday" },
  { weekday: 5, name: "Friday" },
  { weekday: 6, name: "Saturday" },
  { weekday: 0, name: "Sunday" },
];

function defaultDays() {
  return DAYS.map((day) => ({
    ...day,
    enabled: day.weekday >= 1 && day.weekday <= 5,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 60,
  }));
}

export default function StaffAvailabilitySettings() {
  const [staff, setStaff] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [editor, setEditor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load(preferredStaffId = "") {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/settings/staff-availability",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load staff availability."
        );
      }

      const staffRows = Array.isArray(result.staff)
        ? result.staff
        : [];

      const availabilityRows = Array.isArray(
        result.availability
      )
        ? result.availability
        : [];

      setStaff(staffRows);
      setAvailability(availabilityRows);
      setCanEdit(Boolean(result.canEdit));

      const nextSelected =
        preferredStaffId ||
        selectedId ||
        staffRows[0]?.id ||
        "";

      setSelectedId(nextSelected);

      if (nextSelected) {
        buildEditor(
          nextSelected,
          staffRows,
          availabilityRows
        );
      } else {
        setEditor(null);
      }
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Unable to load staff availability."
      );
    } finally {
      setLoading(false);
    }
  }

  function buildEditor(
    staffId,
    staffRows = staff,
    availabilityRows = availability
  ) {
    const person = staffRows.find(
      (item) => item.id === staffId
    );

    if (!person) {
      setEditor(null);
      return;
    }

    const days = DAYS.map((day) => {
      const existing = availabilityRows.find(
        (row) =>
          row.staff_id === staffId &&
          Number(row.weekday) === day.weekday
      );

      return {
        ...day,
        enabled:
          existing?.enabled ??
          (day.weekday >= 1 && day.weekday <= 5),
        startTime:
          existing?.start_time?.slice(0, 5) || "09:00",
        endTime:
          existing?.end_time?.slice(0, 5) || "17:00",
        slotMinutes:
          Number(existing?.slot_minutes) || 60,
      };
    });

    setEditor({
      staffId: person.id,
      name: person.name || "",
      email: person.email || "",
      phone: person.phone || "",
      active: person.active !== false,
      days,
    });
  }

  function chooseStaff(staffId) {
    setSelectedId(staffId);
    buildEditor(staffId);
    setError("");
    setSuccess("");
  }

  function updateEditor(field, value) {
    setEditor((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccess("");
  }

  function updateDay(weekday, field, value) {
    setEditor((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.weekday === weekday
          ? { ...day, [field]: value }
          : day
      ),
    }));
    setSuccess("");
  }

  async function addPerson() {
    try {
      setAdding(true);
      setError("");
      setSuccess("");

      if (!newName.trim()) {
        throw new Error("Enter the person name.");
      }

      const response = await fetch(
        "/api/settings/staff-availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName.trim(),
            email: newEmail.trim(),
            phone: newPhone.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to add person."
        );
      }

      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setSuccess("Person added.");

      await load(result.staff?.id || "");
    } catch (addError) {
      setError(
        addError?.message || "Unable to add person."
      );
    } finally {
      setAdding(false);
    }
  }

  async function savePerson() {
    if (!editor) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      for (const day of editor.days) {
        if (day.enabled && day.startTime >= day.endTime) {
          throw new Error(
            `${day.name}: start time must be before end time.`
          );
        }
      }

      const response = await fetch(
        "/api/settings/staff-availability",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId: editor.staffId,
            name: editor.name,
            email: editor.email,
            phone: editor.phone,
            active: editor.active,
            days: editor.days.map((day) => ({
              weekday: day.weekday,
              enabled: day.enabled,
              startTime: day.startTime,
              endTime: day.endTime,
              slotMinutes: day.slotMinutes,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to save person availability."
        );
      }

      setSuccess("Person availability saved.");
      await load(editor.staffId);
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Unable to save person availability."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removePerson() {
    if (!editor) return;

    const confirmed = window.confirm(
      `Remove ${editor.name}? This will also remove their availability.`
    );

    if (!confirmed) return;

    try {
      setRemoving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/settings/staff-availability",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId: editor.staffId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to remove person."
        );
      }

      setSelectedId("");
      setEditor(null);
      setSuccess("Person removed.");
      await load();
    } catch (removeError) {
      setError(
        removeError?.message || "Unable to remove person."
      );
    } finally {
      setRemoving(false);
    }
  }

  const selectedPerson = useMemo(
    () => staff.find((item) => item.id === selectedId),
    [staff, selectedId]
  );

  if (loading && staff.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">
          Loading staff availability...
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">
          People & Technician Availability
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Add the person who can take appointments and define when
          that person is available.
        </p>

        {!canEdit && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            Read-only access. Only Owner/Admin can make changes.
          </p>
        )}
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {canEdit && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-bold text-slate-800">
              Add Person / Technician
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={newName}
                onChange={(event) =>
                  setNewName(event.target.value)
                }
                placeholder="Person name *"
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                value={newEmail}
                onChange={(event) =>
                  setNewEmail(event.target.value)
                }
                placeholder="Email (optional)"
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                value={newPhone}
                onChange={(event) =>
                  setNewPhone(event.target.value)
                }
                placeholder="Phone (optional)"
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={addPerson}
              disabled={adding}
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {adding ? "Adding..." : "Add Person"}
            </button>
          </div>
        )}

        {staff.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No people added yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add a technician, dispatcher, owner, or service person
              who can take appointments.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Person
              </label>

              <select
                value={selectedId}
                onChange={(event) =>
                  chooseStaff(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
              >
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                    {person.active === false ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {editor && selectedPerson && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600">
                      Name
                    </span>
                    <input
                      disabled={!canEdit}
                      value={editor.name}
                      onChange={(event) =>
                        updateEditor("name", event.target.value)
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-50"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600">
                      Email
                    </span>
                    <input
                      disabled={!canEdit}
                      value={editor.email}
                      onChange={(event) =>
                        updateEditor("email", event.target.value)
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-50"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600">
                      Phone
                    </span>
                    <input
                      disabled={!canEdit}
                      value={editor.phone}
                      onChange={(event) =>
                        updateEditor("phone", event.target.value)
                      }
                      className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-50"
                    />
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={editor.active}
                    onChange={(event) =>
                      updateEditor(
                        "active",
                        event.target.checked
                      )
                    }
                  />
                  Available for assignment
                </label>

                <div className="space-y-3">
                  {editor.days.map((day) => (
                    <div
                      key={day.weekday}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {day.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {day.enabled
                              ? "Available"
                              : "Not available"}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() =>
                            updateDay(
                              day.weekday,
                              "enabled",
                              !day.enabled
                            )
                          }
                          className={`relative h-6 w-11 rounded-full transition ${
                            day.enabled
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          } ${
                            canEdit
                              ? ""
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                              day.enabled
                                ? "left-[22px]"
                                : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {day.enabled && (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <label className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">
                              Start
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
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
                            />
                          </label>

                          <label className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">
                              End
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
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
                            />
                          </label>

                          <label className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                            <span className="text-xs font-bold text-slate-600">
                              Slot length
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
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
                            >
                              <option value={30}>
                                30 minutes
                              </option>
                              <option value={45}>
                                45 minutes
                              </option>
                              <option value={60}>
                                1 hour
                              </option>
                              <option value={90}>
                                1.5 hours
                              </option>
                              <option value={120}>
                                2 hours
                              </option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={removePerson}
                      disabled={removing}
                      className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
                    >
                      {removing ? "Removing..." : "Remove Person"}
                    </button>

                    <button
                      type="button"
                      onClick={savePerson}
                      disabled={saving}
                      className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Person Availability"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

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
      </div>
    </section>
  );
}
