"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

function IconBase({ children, size = 25 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function LeadsIcon() {
  return (
    <IconBase>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

function FlameIcon() {
  return (
    <IconBase>
      <path d="M12 2s.5 4-2.5 7C7 11.5 7 14 8.5 16c-3-.5-5-3-5-6.5C3.5 5 7 2 7 2s-.5 4 2 5c1.5-2 3-5 3-5Z" />
      <path d="M12 22c4 0 7-2.7 7-6.5 0-2.6-1.4-4.8-3.5-6.5.2 3-1.3 5-3 6.3-1.4 1.1-2.3 2.2-2.3 3.7 0 1.2.7 2.3 1.8 3Z" />
    </IconBase>
  );
}

function CalendarIcon() {
  return (
    <IconBase>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
      <path d="m9 16 2 2 4-4" />
    </IconBase>
  );
}

function ResolvedIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" />
    </IconBase>
  );
}

function ArrowIcon() {
  return (
    <IconBase size={16}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizePriority(value) {
  return String(value || "").trim().toLowerCase();
}

export default function DashboardPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/leads", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const text = await response.text();
      let result = {};

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error(
            `The leads API returned an invalid response (${response.status}).`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          result.error || `Unable to load leads (${response.status}).`
        );
      }

      setLeads(Array.isArray(result.leads) ? result.leads : []);
    } catch (error) {
      console.error("Dashboard lead load error:", error);
      setError(error?.message || "Unable to load dashboard information.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const metrics = useMemo(() => {
    const resolvedStatuses = new Set([
      "resolved",
      "completed",
      "closed",
      "service_done",
    ]);

    const appointmentStatuses = new Set([
      "appointment_requested",
      "appointment_scheduled",
      "scheduled",
      "booked",
    ]);

    const active = leads.filter((lead) => {
      const status = normalizeStatus(lead.status);
      return !resolvedStatuses.has(status) && !lead.deleted_at;
    });

    const hot = active.filter((lead) => {
      const priority = normalizePriority(lead.priority);
      return priority === "hot" || priority === "critical";
    });

    const appointments = leads.filter((lead) => {
      const status = normalizeStatus(lead.status);
      return (
        appointmentStatuses.has(status) ||
        Boolean(lead.preferred_time) ||
        Boolean(lead.appointment_id)
      );
    });

    const resolved = leads.filter((lead) =>
      resolvedStatuses.has(normalizeStatus(lead.status))
    );

    return {
      active: active.length,
      hot: hot.length,
      appointments: appointments.length,
      resolved: resolved.length,
    };
  }, [leads]);

  const recentLeads = useMemo(
    () => leads.filter((lead) => !lead.deleted_at).slice(0, 5),
    [leads]
  );

  const cards = [
    {
      label: "Active Leads",
      value: metrics.active,
      description: "All current opportunities",
      href: "/leads",
      icon: <LeadsIcon />,
      iconClass: "dashboard-stat-icon-blue",
    },
    {
      label: "Hot Leads",
      value: metrics.hot,
      description: "Needs quick attention",
      href: "/hot-leads",
      icon: <FlameIcon />,
      iconClass: "dashboard-stat-icon-orange",
    },
    {
      label: "Appointments",
      value: metrics.appointments,
      description: "Requested or scheduled",
      href: "/appointments",
      icon: <CalendarIcon />,
      iconClass: "dashboard-stat-icon-purple",
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      description: "Completed service requests",
      href: "/resolved",
      icon: <ResolvedIcon />,
      iconClass: "dashboard-stat-icon-green",
    },
  ];

  return (
    <CRMPageShell>
      <section className="dashboard-page">
        <div className="dashboard-heading-row">
          <div>
            <div className="dashboard-eyebrow">Workspace Overview</div>
            <h1 className="dashboard-title">{getGreeting()}</h1>
            <p className="dashboard-subtitle">
              Track new opportunities, urgent requests and service progress from
              one place.
            </p>
          </div>

          <Link href="/leads" className="dashboard-view-all-button">
            <span>View all leads</span>
            <ArrowIcon />
          </Link>
        </div>

        {error && (
          <div className="dashboard-error">
            <div>
              <strong>Unable to refresh dashboard</strong>
              <p>{error}</p>
            </div>
            <button onClick={loadLeads}>Try again</button>
          </div>
        )}

        <div className="dashboard-stat-grid">
          {cards.map((card) => (
            <Link href={card.href} key={card.label} className="dashboard-stat-card">
              <div className="dashboard-stat-card-top">
                <div>
                  <div className="dashboard-stat-label">{card.label}</div>
                  <div className="dashboard-stat-value">
                    {loading ? "—" : card.value}
                  </div>
                </div>

                <div
                  className={`dashboard-stat-icon ${card.iconClass}`}
                  aria-hidden="true"
                >
                  {card.icon}
                </div>
              </div>

              <div className="dashboard-stat-description">
                {card.description}
              </div>
            </Link>
          ))}
        </div>

        <div className="dashboard-content-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Recent leads</h2>
                <p>Latest customer requests entering your workspace.</p>
              </div>
              <Link href="/leads">View all</Link>
            </div>

            {loading ? (
              <div className="dashboard-empty-state">Loading recent leads...</div>
            ) : recentLeads.length === 0 ? (
              <div className="dashboard-empty-state">
                <strong>No leads yet</strong>
                <span>
                  New phone and website leads will appear here automatically.
                </span>
              </div>
            ) : (
              <div className="dashboard-recent-list">
                {recentLeads.map((lead) => {
                  const customer = lead.customer || {};
                  const priority = normalizePriority(lead.priority);
                  const status = normalizeStatus(lead.status);

                  return (
                    <Link
                      href={`/leads/${lead.id}`}
                      key={lead.id}
                      className="dashboard-recent-row"
                    >
                      <div className="dashboard-avatar">
                        {(customer.full_name || "C").charAt(0).toUpperCase()}
                      </div>

                      <div className="dashboard-recent-main">
                        <div className="dashboard-recent-name">
                          {customer.full_name || "Customer"}
                        </div>
                        <div className="dashboard-recent-issue">
                          {lead.service_issue || "Service request"}
                        </div>
                      </div>

                      <div className="dashboard-recent-meta">
                        <span
                          className={`dashboard-priority-badge dashboard-priority-${priority || "normal"}`}
                        >
                          {priority || "normal"}
                        </span>

                        <span className="dashboard-status-text">
                          {status.replaceAll("_", " ") || "new"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dashboard-panel dashboard-priority-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Priority queue</h2>
                <p>Requests that may need faster follow-up.</p>
              </div>
            </div>

            <div className="dashboard-priority-summary">
              <div className="dashboard-priority-circle">
                <FlameIcon />
              </div>
              <div>
                <div className="dashboard-priority-count">
                  {loading ? "—" : metrics.hot}
                </div>
                <div className="dashboard-priority-caption">
                  hot or critical leads
                </div>
              </div>
            </div>

            <Link href="/hot-leads" className="dashboard-secondary-action">
              Open hot leads
              <ArrowIcon />
            </Link>
          </section>
        </div>
      </section>
    </CRMPageShell>
  );
}
