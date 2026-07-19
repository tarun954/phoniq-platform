"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        Loading dashboard...
      </main>
    );
  }

  const metrics = data.metrics || {};
  const leads = data.leads || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">RevenueOS Dashboard</h1>
            <p className="text-slate-400">
              Live leads coming from Atlas AI + Google Sheet
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="bg-blue-600 px-5 py-3 rounded-xl font-semibold"
          >
            Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Metric title="Total Leads" value={metrics.totalLeads || 0} />
          <Metric title="Hot Leads" value={metrics.hotLeads || 0} />
          <Metric title="Appointments" value={metrics.appointments || 0} />
          <Metric title="Missed Calls" value={metrics.missedCalls || 0} />
          <Metric
            title="Est. Revenue"
            value={`$${(metrics.estimatedRevenue || 0).toLocaleString()}`}
          />
        </div>

        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-5">Live Lead Pipeline</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3">Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Issue</th>
                  <th>Preferred Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-semibold">{lead.name}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.city}</td>
                    <td>{lead.serviceIssue}</td>
                    <td>{lead.preferredTime}</td>
                    <td>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 && (
            <p className="text-slate-500 text-center py-10">
              No leads found yet. Submit one through Atlas chat.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}