"use client";

import { useEffect, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/jobs", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load jobs"
        );
      }

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function updateJobStatus(id, status) {
    try {
      setError("");

      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update job"
        );
      }

      await loadJobs();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CRMPageShell>
      <div className="crm-module-page">
        <div className="crm-module-heading">
          <div>
            <div className="crm-eyebrow">
              Field Operations
            </div>

            <h1>Jobs</h1>

            <p>
              Track scheduled work from creation through
              completion.
            </p>
          </div>
        </div>

        {error && (
          <div className="crm-error-banner">
            {error}
          </div>
        )}

        <div className="crm-card">
          {loading ? (
            <div className="crm-empty-state">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="crm-empty-state">
              <strong>No jobs found</strong>

              <span>
                Create a job from an appointment.
              </span>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Job</th>
                    <th>Schedule</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="crm-customer-cell">
                          <strong>
                            {job.customer?.full_name ||
                              "Customer"}
                          </strong>

                          {job.customer?.phone && (
                            <span>
                              {job.customer.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
  <div className="crm-job-cell">
    <strong>
      {job.title || "Service Job"}
    </strong>

    {job.service_issue && (
      <span className="crm-secondary-text">
        {job.service_issue}
      </span>
    )}
  </div>
</td>

                      <td>
                        {job.scheduled_start
                          ? new Date(
                              job.scheduled_start
                            ).toLocaleString()
                          : "Not scheduled"}
                      </td>

                      <td>
                        <select
                          className="phoniq-select"
                          value={job.status || "new"}
                          onChange={(event) =>
                            updateJobStatus(
                              job.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="new">
                            New
                          </option>

                          <option value="scheduled">
                            Scheduled
                          </option>

                          <option value="in_progress">
                            In Progress
                          </option>

                          <option value="completed">
                            Completed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CRMPageShell>
  );
}