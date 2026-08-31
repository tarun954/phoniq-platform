"use client";

import { useEffect, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function WhatsAppDiagnosticsPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const response = await fetch(
        "/api/integrations/whatsapp/status",
        { cache: "no-store" }
      );

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(
          data?.error ||
          "Unable to check WhatsApp."
        );
      }
    } catch (err) {
      setError(
        err?.message ||
        "Unable to check WhatsApp."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <CRMPageShell
      eyebrow="INTEGRATIONS"
      title="WhatsApp Diagnostics"
      description="Verify the Telnyx API key and WhatsApp sender used by this Phoniq environment."
    >
      <section className="wa-card">
        <button className="wa-button" onClick={load}>
          Refresh Telnyx Status
        </button>

        {error && (
          <div className="wa-error">{error}</div>
        )}

        {!result ? (
          <p>Checking Telnyx...</p>
        ) : (
          <>
            <div className="wa-grid">
              <Info
                label="Configured FROM"
                value={result.configuredFrom || "—"}
              />
              <Info
                label="Found by same API key"
                value={
                  result.configuredNumberFound
                    ? "YES"
                    : "NO"
                }
              />
              <Info
                label="Telnyx status"
                value={
                  result.configuredNumber?.status ||
                  "—"
                }
              />
              <Info
                label="Enabled"
                value={
                  result.configuredNumber
                    ?.enabled === true
                    ? "YES"
                    : result.configuredNumber
                        ?.enabled === false
                    ? "NO"
                    : "—"
                }
              />
              <Info
                label="WABA ID"
                value={
                  result.configuredNumber
                    ?.waba_id || "—"
                }
              />
              <Info
                label="Template"
                value={
                  result.template?.name || "—"
                }
              />
            </div>

            <div className="wa-diagnosis">
              <strong>Diagnosis</strong>
              <p>{result.diagnosis || result.error}</p>
            </div>

            <details>
              <summary>Raw diagnostic JSON</summary>
              <pre>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}
      </section>

      <style jsx global>{`
        .wa-card {
          background: #fff;
          border: 1px solid #dce4ef;
          border-radius: 16px;
          padding: 22px;
        }

        .wa-button {
          border: 0;
          border-radius: 9px;
          padding: 11px 15px;
          background: #2563eb;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .wa-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .wa-info {
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 14px;
          background: #f8fafc;
        }

        .wa-info small,
        .wa-info strong {
          display: block;
        }

        .wa-info small {
          color: #64748b;
          margin-bottom: 5px;
        }

        .wa-diagnosis {
          margin-top: 20px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          border-radius: 11px;
          padding: 15px;
        }

        .wa-diagnosis p {
          margin: 6px 0 0;
          color: #334155;
          line-height: 1.5;
        }

        .wa-error {
          margin-top: 15px;
          color: #b42318;
        }

        details {
          margin-top: 18px;
        }

        pre {
          max-height: 420px;
          overflow: auto;
          background: #0f172a;
          color: #e2e8f0;
          padding: 14px;
          border-radius: 10px;
          font-size: 12px;
        }
      `}</style>
    </CRMPageShell>
  );
}

function Info({ label, value }) {
  return (
    <div className="wa-info">
      <small>{label}</small>
      <strong>{String(value)}</strong>
    </div>
  );
}
