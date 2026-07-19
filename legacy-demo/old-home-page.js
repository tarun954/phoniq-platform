// "use client";

// import { useState } from "react";
// import ChatWidget from "../components/ChatWidget";

// export default function Home() {
//   const [latestLead, setLatestLead] = useState(null);

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
//       <section className="max-w-7xl mx-auto px-6 py-16">
//         <nav className="flex justify-between items-center mb-16">
//           <div>
//             <h1 className="text-2xl font-bold">RevenueOS</h1>
//             <p className="text-sm text-blue-300">Powered by Atlas AI</p>
//           </div>
//           <button className="bg-blue-500 px-5 py-2 rounded-xl font-semibold">
//             Live Demo
//           </button>
//         </nav>

//         <div className="grid lg:grid-cols-2 gap-14 items-center">
//           <div>
//             <p className="text-blue-300 font-semibold mb-4">
//               AI Revenue Agent for HVAC Companies
//             </p>

//             <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
//               Turn missed leads into booked service calls.
//             </h2>

//             <p className="text-lg text-slate-300 mb-8">
//               Atlas captures website visitors, recovers missed calls, qualifies
//               urgency, estimates lead value, and saves structured data for the
//               business owner.
//             </p>

//             <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-5">
//               <h3 className="font-bold mb-2">Not a chatbot. A revenue agent.</h3>
//               <p className="text-slate-300 text-sm">
//                 Chatbots answer questions. Atlas captures revenue opportunities
//                 and creates appointment-ready leads.
//               </p>
//             </div>
//           </div>

//           <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl">
//             <div className="flex justify-between items-center mb-5">
//               <div>
//                 <h3 className="text-2xl font-bold">Owner Dashboard Preview</h3>
//                 <p className="text-sm text-slate-500">
//                   Live lead captured by Atlas
//                 </p>
//               </div>
//               <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
//                 LIVE
//               </span>
//             </div>

//             {latestLead ? (
//               <div className="space-y-4">
//                 <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
//                   <p className="text-sm text-orange-700 font-semibold">
//                     New {latestLead.score} Lead Captured
//                   </p>
//                   <p className="text-2xl font-bold mt-1">
//                     {latestLead.name || "Customer"}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3 text-sm">
//                   <Info label="Phone" value={latestLead.phone} />
//                   <Info label="City" value={latestLead.city} />
//                   <Info label="Issue" value={latestLead.serviceIssue} />
//                   <Info label="Preferred Time" value={latestLead.preferredTime} />
//                   <Info label="Lead Score" value={latestLead.score} />
//                   <Info label="Status" value={latestLead.status} />
//                 </div>

//                 <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
//                   <p className="text-sm text-green-700 font-semibold">
//                     Estimated Job Value
//                   </p>
//                   <p className="text-3xl font-bold">$500 – $3,000</p>
//                   <p className="text-xs text-slate-500 mt-1">
//                     Based on HVAC repair/replacement opportunity
//                   </p>
//                 </div>

//                 <div className="bg-slate-100 rounded-2xl p-4 text-sm">
//                   ✅ Saved to Google Sheet pipeline
//                   <br />
//                   ✅ Ready for owner follow-up
//                   <br />
//                   ✅ Appointment request captured
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-slate-100 rounded-2xl p-8 text-center">
//                 <p className="text-slate-500 mb-3">No lead captured yet</p>
//                 <p className="text-sm text-slate-500">
//                   Use the Atlas chat widget to simulate a website lead or missed
//                   call recovery.
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </section>

//       <ChatWidget onLeadUpdate={setLatestLead} />
//     </main>
//   );
// }

// function Info({ label, value }) {
//   return (
//     <div className="bg-slate-100 rounded-xl p-3">
//       <p className="text-xs text-slate-500">{label}</p>
//       <p className="font-semibold">{value || "-"}</p>
//     </div>
//   );
// }

import RevenueOSPrototype from "../components/RevenueOSPrototype";

export default function Home() {
  return <RevenueOSPrototype />;
}