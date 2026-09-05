"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/crm/ClientShell";
import AvailabilitySettings from "@/components/settings/AvailabilitySettings";
import StaffAvailabilitySettings from "@/components/settings/StaffAvailabilitySettings";

export default function SettingsPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to load settings.");
        return;
      }

      setData(result);

      setForm({
        user: {
          fullName: result.user?.fullName || "",
        },
        company: {
          ...result.company,
        },
      });
    } catch (loadError) {
      setError(loadError?.message || "Unable to load settings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateCompany(key, value) {
    setForm((current) => ({
      ...current,
      company: {
        ...current.company,
        [key]: value,
      },
    }));
  }

  async function saveSettings() {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to save settings.");
        return;
      }

      setMessage("Settings updated.");
      await load();
    } catch (saveError) {
      setError(saveError?.message || "Unable to save settings.");
    }
  }

  async function changePassword() {
    setError("");
    setMessage("");

    if (!password) {
      setError("Enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to update password.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (passwordError) {
      setError(
        passwordError?.message || "Unable to update password."
      );
    }
  }

  return (
    <ClientShell>
      <div className="settings-page">
        <p style={eyebrow}>WORKSPACE CONFIGURATION</p>
        <h1 style={title}>Settings</h1>
        <p style={subtitle}>
          View your user and company information. Owners and admins can
          edit workspace settings.
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {message && <div style={successStyle}>{message}</div>}

        {!data || !form ? (
          <div style={card}>Loading settings...</div>
        ) : (
          <>
            <section style={card}>
              <div style={roleBanner}>
                Current workspace role:{" "}
                <strong>{data.role?.name}</strong>
                {!data.canEdit && <span> · Read-only access</span>}
              </div>

              <h2 style={sectionHeading}>User Information</h2>

              <div className="settings-grid">
                <Field
                  label="Full name"
                  value={form.user.fullName}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      user: {
                        ...current.user,
                        fullName: value,
                      },
                    }))
                  }
                />

                <Field
                  label="Email"
                  value={data.user?.email || ""}
                  disabled
                />
              </div>

              <h2 style={{ ...sectionHeading, marginTop: 30 }}>
                Company Information
              </h2>

              <div className="settings-grid">
                <Field
                  label="Company name"
                  value={form.company.name}
                  disabled={!data.canEdit}
                  onChange={(value) => updateCompany("name", value)}
                />

                <Field
                  label="Business type"
                  value={form.company.businessType}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("businessType", value)
                  }
                />

                <Field
                  label="Website"
                  value={form.company.website}
                  disabled={!data.canEdit}
                  onChange={(value) => updateCompany("website", value)}
                />

                <Field
                  label="Main phone"
                  value={form.company.mainPhone}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("mainPhone", value)
                  }
                />

                <Field
                  label="Service area"
                  value={form.company.serviceArea}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("serviceArea", value)
                  }
                />

                <Field
                  label="Timezone"
                  value={form.company.timezone}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("timezone", value)
                  }
                />

                <Field
                  label="Support email"
                  value={form.company.supportEmail}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("supportEmail", value)
                  }
                />

                <Field
                  label="Support phone"
                  value={form.company.supportPhone}
                  disabled={!data.canEdit}
                  onChange={(value) =>
                    updateCompany("supportPhone", value)
                  }
                />
              </div>

              {data.canEdit && (
                <button
                  style={primaryButton}
                  onClick={saveSettings}
                >
                  Save User & Company Info
                </button>
              )}
            </section>

            <div className="settings-section">
              <AvailabilitySettings />
            </div>

            <div className="settings-section">
              <StaffAvailabilitySettings />
            </div>

            {data.canEdit && (
              <section style={card}>
                <h2 style={sectionHeading}>Security</h2>

                <p style={subtitle}>
                  Update the password for your current account.
                </p>

                <div className="settings-grid">
                  <Field
                    type="password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                  />

                  <Field
                    type="password"
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>

                <button
                  style={primaryButton}
                  onClick={changePassword}
                >
                  Update Password
                </button>
              </section>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        .settings-page {
          width: 100%;
          min-width: 0;
          padding-bottom: 36px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .settings-section {
          margin-top: 24px;
        }

        @media (max-width: 760px) {
          .settings-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .settings-page h1 {
            font-size: 32px !important;
          }

          .settings-page section {
            padding: 18px !important;
          }
        }
      `}</style>
    </ClientShell>
  );
}

function Field({
  label,
  value,
  disabled = false,
  onChange,
  type = "text",
}) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        style={{
          ...inputStyle,
          background: disabled ? "#f8fafc" : "#fff",
          color: disabled ? "#64748b" : "#0f172a",
        }}
      />
    </label>
  );
}

const eyebrow = {
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1.5,
  margin: 0,
};

const title = {
  fontSize: 40,
  margin: "7px 0",
};

const subtitle = {
  color: "#64748b",
  lineHeight: 1.5,
};

const card = {
  background: "#fff",
  border: "1px solid #dce4ef",
  borderRadius: 16,
  padding: 24,
  marginTop: 24,
};

const sectionHeading = {
  margin: 0,
  fontSize: 18,
  color: "#0f172a",
};

const roleBanner = {
  background: "#f8fafc",
  borderRadius: 11,
  padding: 14,
  color: "#64748b",
  marginBottom: 24,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 7,
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "12px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
};

const primaryButton = {
  marginTop: 20,
  border: 0,
  background: "#2563eb",
  color: "#fff",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 850,
  cursor: "pointer",
};

const errorStyle = {
  padding: 12,
  marginTop: 18,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  color: "#b42318",
  borderRadius: 10,
};

const successStyle = {
  padding: 12,
  marginTop: 18,
  background: "#ecfdf3",
  border: "1px solid #bbf7d0",
  color: "#067647",
  borderRadius: 10,
};
