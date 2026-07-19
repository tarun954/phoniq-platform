"use client";

import { useState } from "react";

export default function ChatWidget({ onLeadUpdate }) {
  const initialLead = {
    name: "",
    phone: "",
    language: "English",
    serviceIssue: "",
    preferredTime: "",
    city: "",
    status: "New",
    notes: "",
    score: "Normal",
  };

  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm Atlas, the HVAC revenue agent. Tell me what problem you're having and I’ll help request an appointment.",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("issue");
  const [lead, setLead] = useState(initialLead);
  const [saved, setSaved] = useState(false);

  function detectLanguage(text) {
    const lower = text.toLowerCase();

    if (lower.includes("hola") || lower.includes("español")) return "Spanish";
    if (lower.includes("namaste") || lower.includes("hindi")) return "Hindi";
    if (lower.includes("telugu")) return "Telugu";

    return "English";
  }

  function getLeadScore(text) {
    const msg = text.toLowerCase();

    if (
      msg.includes("not working") ||
      msg.includes("emergency") ||
      msg.includes("urgent") ||
      msg.includes("stopped") ||
      msg.includes("broken") ||
      msg.includes("no cooling") ||
      msg.includes("no heat")
    ) {
      return "Hot";
    }

    if (
      msg.includes("repair") ||
      msg.includes("service") ||
      msg.includes("today") ||
      msg.includes("appointment")
    ) {
      return "Warm";
    }

    return "Normal";
  }

  function parseDetails(text) {
    const parts = text.split(",").map((p) => p.trim());

    return {
      name: parts[0] || "",
      phone: parts[1] || "",
      city: parts[2] || "",
    };
  }

  async function saveLead(finalLead) {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalLead),
      });

      setSaved(true);
    } catch (error) {
      console.error("Lead save failed:", error);
    }
  }

  function resetDemo() {
    setMessages([
      {
        role: "bot",
        text: "Hi! I'm Atlas, the HVAC revenue agent. Tell me what problem you're having and I’ll help request an appointment.",
      },
    ]);

    setLead(initialLead);
    setStep("issue");
    setSaved(false);
    setInput("");
  }

  function startMissedCallFlow() {
    setMessages([
      {
        role: "bot",
        text: "Missed Call Recovery Triggered.\n\nAtlas detected a missed HVAC call.\n\nHi, sorry we missed your call. Are you looking for HVAC service today or tomorrow?",
      },
    ]);

    setLead({
      name: "",
      phone: "",
      language: "English",
      serviceIssue: "Missed call HVAC service request",
      preferredTime: "",
      city: "",
      status: "Missed Call Recovered",
      notes: "Missed call recovery demo triggered from website",
      score: "Hot",
    });

    setStep("time");
    setSaved(false);
    setInput("");
  }

  function getBotReply(text) {
    const msg = text.toLowerCase();

    if (step === "issue") {
      const language = detectLanguage(text);
      const score = getLeadScore(text);

      setLead((prev) => ({
        ...prev,
        language,
        serviceIssue: text,
        score,
      }));

      setStep("time");

      if (score === "Hot") {
        return "That sounds urgent. I can capture your request now. Do you need service today or tomorrow?";
      }

      return "I can help with that. Do you need service today or tomorrow?";
    }

    if (step === "time") {
      if (msg.includes("today")) {
        setStep("slot");
        return "Good. We have openings today at 2 PM or 4 PM. Which time works better?";
      }

      if (msg.includes("tomorrow")) {
        setStep("slot");
        return "Good. We have openings tomorrow at 10 AM or 4 PM. Which time works better?";
      }

      setStep("slot");
      return "We can request Today 2 PM, Today 4 PM, Tomorrow 10 AM, or Tomorrow 4 PM. Which one do you prefer?";
    }

    if (step === "slot") {
      let selectedTime = text;

      if (msg.includes("tomorrow") && msg.includes("4")) selectedTime = "Tomorrow 4 PM";
      else if (msg.includes("tomorrow") && msg.includes("10")) selectedTime = "Tomorrow 10 AM";
      else if (msg.includes("today") && msg.includes("4")) selectedTime = "Today 4 PM";
      else if (msg.includes("today") && msg.includes("2")) selectedTime = "Today 2 PM";
      else if (msg.includes("4")) selectedTime = "Tomorrow 4 PM";
      else if (msg.includes("10")) selectedTime = "Tomorrow 10 AM";
      else if (msg.includes("2")) selectedTime = "Today 2 PM";

      setLead((prev) => ({
        ...prev,
        preferredTime: selectedTime,
      }));

      setStep("details");
      return "Perfect. Please share your name, phone number, and city like this: Tarun, 214-555-1234, Frisco";
    }

    if (step === "details") {
      const details = parseDetails(text);

      const finalLead = {
        ...lead,
        name: details.name,
        phone: details.phone,
        city: details.city,
        status:
          lead.status === "Missed Call Recovered"
            ? "Missed Call Recovered"
            : "Appointment Requested",
        notes:
          lead.status === "Missed Call Recovered"
            ? `Lead Score: ${lead.score}. Missed call recovered and appointment request captured.`
            : `Lead Score: ${lead.score}. Captured from Atlas website revenue agent demo.`,
      };

      setLead(finalLead);
      if (onLeadUpdate) {
        onLeadUpdate(finalLead);
      }
      
      saveLead(finalLead);
      setStep("done");
      saveLead(finalLead);
      setStep("done");

      return `Appointment request captured.

Lead Summary:
Name: ${details.name}
Phone: ${details.phone}
City: ${details.city}
Issue: ${finalLead.serviceIssue}
Preferred Time: ${finalLead.preferredTime}
Lead Score: ${finalLead.score}
Status: ${finalLead.status}

This lead has been saved for the business owner.`;
    }

    return "This lead is already captured. You can start a new demo using the button below.";
  }

  function sendMessage() {
    if (!input.trim()) return;

    const userText = input;
    const botText = getBotReply(userText);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText },
      { role: "bot", text: botText },
    ]);

    setInput("");
  }

  const progress = {
    issue: 20,
    time: 40,
    slot: 60,
    details: 80,
    done: 100,
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg"
      >
        Open Atlas Agent
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[430px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold">Atlas HVAC Revenue Agent</h3>
          <p className="text-sm text-blue-100">
            Qualifies leads • Recovers calls • Saves pipeline data
          </p>
        </div>
        <button onClick={() => setOpen(false)} className="text-white text-xl">
          ×
        </button>
      </div>

      <div className="px-4 pt-3 bg-white">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Lead Capture Progress</span>
          <span>{progress[step]}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${progress[step]}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-t mt-3">
        <button
          onClick={startMissedCallFlow}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
        >
          Simulate Missed Call Recovery
        </button>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[85%] text-sm whitespace-pre-line ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-white text-gray-800 border border-gray-300"
            }`}
          >
            {m.text}
          </div>
        ))}

        {step === "done" && (
          <div className="bg-green-50 border border-green-300 text-green-900 rounded-xl p-3 text-sm">
            <p className="font-bold">RevenueOS Action Completed</p>
            <p>✅ Lead captured</p>
            <p>✅ Appointment request created</p>
            <p>✅ Saved to Google Sheet</p>
            <p>✅ Ready for owner follow-up</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div className="bg-white border rounded-lg p-2">
            <p className="font-semibold">Lead Score</p>
            <p>{lead.score}</p>
          </div>
          <div className="bg-white border rounded-lg p-2">
            <p className="font-semibold">Status</p>
            <p>{saved ? "Saved" : lead.status}</p>
          </div>
        </div>
      </div>

      {step !== "done" ? (
        <div className="p-3 border-t flex gap-2 bg-white">
          <input
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none text-gray-900 placeholder-gray-500 bg-white"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Send
          </button>
        </div>
      ) : (
        <div className="p-3 border-t bg-white">
          <button
            onClick={resetDemo}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold"
          >
            Start New Demo
          </button>
        </div>
      )}
    </div>
  );
}