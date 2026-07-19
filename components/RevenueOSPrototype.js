"use client";

import { useState } from "react";

export default function RevenueOSPrototype() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leads, setLeads] = useState([
    {
      name: "Tarun",
      phone: "214-555-1234",
      source: "Website Chat",
      issue: "AC not working",
      score: "Hot",
      value: "$500 - $3,000",
      status: "Appointment Requested",
      time: "Tomorrow 4 PM",
    },
    {
      name: "John D.",
      phone: "469-555-9876",
      source: "Missed Call",
      issue: "AC blowing hot air",
      score: "Hot",
      value: "$750 - $4,000",
      status: "Recovered",
      time: "Today 4 PM",
    },
  ]);

  const [latestLead, setLatestLead] = useState(null);

  async function createLead(type) {
    const scenarios = {
      website: {
        name: "Sarah M.",
        phone: "972-555-1111",
        source: "Website Chat",
        issue: "AC not cooling",
        score: "Hot",
        value: "$500 - $3,000",
        status: "Appointment Requested",
        time: "Today 2 PM",
      },
      missed: {
        name: "Mike R.",
        phone: "214-555-2222",
        source: "Missed Call",
        issue: "No answer - HVAC service request",
        score: "Hot",
        value: "$750 - $4,000",
        status: "Missed Call Recovered",
        time: "Today 4 PM",
      },
      emergency: {
        name: "Priya K.",
        phone: "469-555-3333",
        source: "Emergency Call",
        issue: "AC stopped working completely",
        score: "Critical",
        value: "$1,500 - $7,000",
        status: "Priority Emergency",
        time: "ASAP",
      },
      afterhours: {
        name: "David L.",
        phone: "682-555-4444",
        source: "After-Hours Lead",
        issue: "Needs AC repair tomorrow",
        score: "Warm",
        value: "$500 - $2,500",
        status: "After-Hours Captured",
        time: "Tomorrow 10 AM",
      },
    };

    const lead = scenarios[type];
    setLeads((prev) => [lead, ...prev]);
    setLatestLead(lead);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          language: "English",
          serviceIssue: lead.issue,
          preferredTime: lead.time,
          city: "Frisco",
          status: lead.status,
          notes: `${lead.source} | ${lead.score} | Estimated value ${lead.value}`,
        }),
      });
    } catch (e) {
      console.log("Sheet save skipped/failed:", e);
    }
  }

  const hotLeads = leads.filter((l) => l.score === "Hot" || l.score === "Critical").length;
  const appointments = leads.filter((l) => l.status.includes("Appointment") || l.status.includes("Emergency")).length;
  const missedCalls = leads.filter((l) => l.source === "Missed Call").length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">RevenueOS</h1>
            <p className="text-blue-300">AI Revenue Agent for Home Service Businesses</p>
          </div>
          <div className="flex gap-3">
            {["dashboard", "chat", "callcenter", "agents", "settings", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl capitalize ${
                  activeTab === tab ? "bg-blue-600" : "bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === "dashboard" && (
          <>
            <Hero latestLead={latestLead} />
            <MetricCards leads={leads} hotLeads={hotLeads} appointments={appointments} missedCalls={missedCalls} />
            <LeadTable leads={leads} />
          </>
        )}
        {activeTab === "chat" && <AIChatDemo setLatestLead={setLatestLead} setLeads={setLeads} />}
        {activeTab === "callcenter" && <CallCenter createLead={createLead} latestLead={latestLead} />}

        {activeTab === "agents" && <AgentCenter />}

        {activeTab === "settings" && <Settings />}

        {activeTab === "analytics" && <Analytics leads={leads} />}
      </div>
    </main>
  );
}

function Hero({ latestLead }) {
  return (
    <section className="grid lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 border border-white/10">
        <p className="text-blue-300 font-semibold mb-3">Powered by Atlas AI</p>
        <h2 className="text-5xl font-bold mb-5">Turn missed leads into booked service calls.</h2>
        <p className="text-slate-300 mb-6">
          Atlas captures website visitors, recovers missed calls, handles after-hours leads,
          qualifies urgency, estimates revenue, and creates appointment-ready leads.
        </p>
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-5">
          <b>Not a chatbot. A revenue agent.</b>
          <p className="text-sm text-slate-300 mt-2">
            Chatbots answer questions. Atlas creates qualified revenue opportunities.
          </p>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-3xl p-6">
        <h3 className="text-2xl font-bold mb-2">Owner Dashboard Preview</h3>
        <p className="text-sm text-slate-500 mb-5">Latest opportunity captured by Atlas</p>

        {latestLead ? (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
              <p className="text-orange-700 font-bold">New {latestLead.score} Lead Captured</p>
              <p className="text-2xl font-bold">{latestLead.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Phone" value={latestLead.phone} />
              <Info label="Source" value={latestLead.source} />
              <Info label="Issue" value={latestLead.issue} />
              <Info label="Preferred Time" value={latestLead.time} />
              <Info label="Lead Score" value={latestLead.score} />
              <Info label="Status" value={latestLead.status} />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
              <p className="text-green-700 font-semibold">Estimated Job Value</p>
              <p className="text-3xl font-bold">{latestLead.value}</p>
            </div>
          </div>
        ) : (
          <p className="bg-slate-100 rounded-2xl p-8 text-center text-slate-500">
            Use Call Center to generate a lead.
          </p>
        )}
      </div>
    </section>
  );
}

function MetricCards({ leads, hotLeads, appointments, missedCalls }) {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      <Metric title="Total Leads" value={leads.length} />
      <Metric title="Hot Leads" value={hotLeads} />
      <Metric title="Appointments" value={appointments} />
      <Metric title="Missed Calls Recovered" value={missedCalls} />
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400">{title}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}

function LeadTable({ leads }) {
  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6">
      <h3 className="text-2xl font-bold mb-4">Live Lead Pipeline</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-3">Name</th>
            <th>Phone</th>
            <th>Source</th>
            <th>Issue</th>
            <th>Score</th>
            <th>Status</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} className="border-b">
              <td className="py-3 font-semibold">{l.name}</td>
              <td>{l.phone}</td>
              <td>{l.source}</td>
              <td>{l.issue}</td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  l.score === "Critical" ? "bg-red-100 text-red-700" :
                  l.score === "Hot" ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {l.score}
                </span>
              </td>
              <td>{l.status}</td>
              <td>{l.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CallCenter({ createLead, latestLead }) {
  return (
    <section className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white/10 rounded-3xl p-6 border border-white/10">
        <h2 className="text-3xl font-bold mb-4">Atlas Call Center</h2>
        <p className="text-slate-300 mb-6">
          Simulate real revenue events: website leads, missed calls, emergency calls, and after-hours leads.
        </p>

        <div className="grid gap-4">
          <button onClick={() => createLead("website")} className="bg-blue-600 p-4 rounded-xl font-bold">
            Simulate Website Lead
          </button>
          <button onClick={() => createLead("missed")} className="bg-orange-500 p-4 rounded-xl font-bold">
            Simulate Missed Call Recovery
          </button>
          <button onClick={() => createLead("emergency")} className="bg-red-600 p-4 rounded-xl font-bold">
            Simulate Emergency Call
          </button>
          <button onClick={() => createLead("afterhours")} className="bg-purple-600 p-4 rounded-xl font-bold">
            Simulate After-Hours Lead
          </button>
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-3xl p-6">
        <h3 className="text-2xl font-bold mb-4">Call Event Timeline</h3>
        {latestLead ? (
          <div className="space-y-4">
            <Timeline text={`${latestLead.source} detected`} />
            <Timeline text="Atlas qualified customer intent" />
            <Timeline text={`Lead score marked as ${latestLead.score}`} />
            <Timeline text={`Appointment request: ${latestLead.time}`} />
            <Timeline text="Owner dashboard updated" />
          </div>
        ) : (
          <p className="text-slate-500">No call event yet.</p>
        )}
      </div>
    </section>
  );
}

function AgentCenter() {
  const agents = [
    ["Website Agent", "Running", "Captures website visitors"],
    ["Phone Agent", "Simulation", "Handles missed and emergency calls"],
    ["Scheduling Agent", "Running", "Creates appointment requests"],
    ["Follow-Up Agent", "Planned", "Will follow up with cold leads"],
    ["Analytics Agent", "Running", "Tracks revenue impact"],
  ];

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6">
      <h2 className="text-3xl font-bold mb-6">Atlas AI Workforce</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {agents.map(([name, status, desc]) => (
          <div key={name} className="bg-slate-100 rounded-2xl p-5">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold">{name}</h3>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{status}</span>
            </div>
            <p className="text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6">
      <h2 className="text-3xl font-bold mb-6">Business Configuration</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Info label="Company Name" value="ABC HVAC Services" />
        <Info label="Service Areas" value="Frisco, Plano, Prosper, McKinney" />
        <Info label="Business Hours" value="Mon-Sat, 8 AM - 6 PM" />
        <Info label="After-Hours Handling" value="Atlas captures and prioritizes leads" />
        <Info label="Emergency Services" value="AC failure, no heat, vulnerable household" />
        <Info label="Appointment Slots" value="Today 2 PM, Today 4 PM, Tomorrow 10 AM" />
      </div>
    </div>
  );
}

function Analytics({ leads }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white text-slate-900 rounded-3xl p-6">
        <h2 className="text-3xl font-bold mb-6">Revenue Analytics</h2>
        <div className="space-y-4">
          <MetricLight title="Estimated Revenue Captured" value="$8,950" />
          <MetricLight title="Average Lead Value" value="$1,200" />
          <MetricLight title="Response Time" value="<60 sec" />
          <MetricLight title="Conversion Opportunity" value="High" />
        </div>
      </div>

      <div className="bg-white text-slate-900 rounded-3xl p-6">
        <h2 className="text-3xl font-bold mb-6">Lead Source Mix</h2>
        {["Website Chat", "Missed Call", "Emergency Call", "After-Hours Lead"].map((s) => (
          <div key={s} className="mb-4">
            <div className="flex justify-between mb-1">
              <span>{s}</span>
              <span>{leads.filter((l) => l.source === s).length}</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full">
              <div className="h-3 bg-blue-600 rounded-full" style={{ width: "65%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-100 rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold">{value || "-"}</p>
    </div>
  );
}

function Timeline({ text }) {
  return <div className="bg-slate-100 rounded-xl p-4">✅ {text}</div>;
}

function MetricLight({ title, value }) {
  return (
    <div className="bg-slate-100 rounded-2xl p-5">
      <p className="text-slate-500">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
function AIChatDemo({ setLatestLead, setLeads }) {
    const [messages, setMessages] = useState([
      {
        role: "bot",
        text: "Hi, I’m Atlas. Tell me what HVAC issue you’re having, and I’ll help request an appointment.",
      },
    ]);
  
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
  
    const [lead, setLead] = useState({
      name: "",
      phone: "",
      language: "English",
      serviceIssue: "",
      preferredTime: "",
      city: "",
      status: "New",
      score: "Normal",
      estimatedValue: "$500 - $3,000",
      notes: "",
    });
  
    async function sendMessage() {
      if (!input.trim() || loading) return;
  
      const newMessages = [...messages, { role: "user", text: input }];
      setMessages(newMessages);
      setInput("");
      setLoading(true);
  
      try {
        const res = await fetch("/api/atlas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            lead,
          }),
        });
  
        const data = await res.json();
  
        const updatedLead = {
          ...lead,
          ...data.lead,
        };
  
        setLead(updatedLead);
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
  
        const isComplete =
          updatedLead.name &&
          updatedLead.phone &&
          updatedLead.city &&
          updatedLead.serviceIssue &&
          updatedLead.preferredTime;
  
        if (isComplete || data.done) {
          const finalLead = {
            name: updatedLead.name,
            phone: updatedLead.phone,
            source: "AI Website Chat",
            issue: updatedLead.serviceIssue,
            score: updatedLead.score || "Hot",
            value: updatedLead.estimatedValue || "$500 - $3,000",
            status: updatedLead.status || "Appointment Requested",
            time: updatedLead.preferredTime,
          };
  
          setLatestLead(finalLead);
          setLeads((prev) => [finalLead, ...prev]);
  
          await fetch("/api/leads", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: updatedLead.name,
              phone: updatedLead.phone,
              language: updatedLead.language || "English",
              serviceIssue: updatedLead.serviceIssue,
              preferredTime: updatedLead.preferredTime,
              city: updatedLead.city,
              status: updatedLead.status || "Appointment Requested",
              notes:
                updatedLead.notes ||
                `AI Website Chat | ${updatedLead.score} | Estimated value ${updatedLead.estimatedValue}`,
            }),
          });
        }
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "I had trouble processing that. Can you share your name, phone, city, and preferred time?",
          },
        ]);
      }
  
      setLoading(false);
    }
  
    return (
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white text-slate-900 rounded-3xl p-6">
          <h2 className="text-3xl font-bold mb-2">Real Atlas AI Chat</h2>
          <p className="text-slate-500 mb-5">
            This is the real AI version. Atlas understands the customer,
            qualifies the lead, and updates the pipeline.
          </p>
  
          <div className="h-[420px] overflow-y-auto bg-slate-100 rounded-2xl p-4 space-y-3 mb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white border text-slate-900"
                }`}
              >
                {m.text}
              </div>
            ))}
  
            {loading && (
              <div className="bg-white border text-slate-500 p-3 rounded-xl w-fit">
                Atlas is thinking...
              </div>
            )}
          </div>
  
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-xl px-4 py-3 text-slate-900"
              placeholder="Example: My AC stopped working and I need help today"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Send
            </button>
          </div>
        </div>
  
        <div className="bg-white text-slate-900 rounded-3xl p-6">
          <h2 className="text-3xl font-bold mb-6">AI Lead Extraction</h2>
  
          <div className="grid gap-3">
            <Info label="Name" value={lead.name} />
            <Info label="Phone" value={lead.phone} />
            <Info label="City" value={lead.city} />
            <Info label="Language" value={lead.language} />
            <Info label="Issue" value={lead.serviceIssue} />
            <Info label="Preferred Time" value={lead.preferredTime} />
            <Info label="Lead Score" value={lead.score} />
            <Info label="Estimated Value" value={lead.estimatedValue} />
            <Info label="Status" value={lead.status} />
          </div>
        </div>
      </section>
    );
  }