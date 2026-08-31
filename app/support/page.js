"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/crm/ClientShell";

export default function SupportPage() {
  const [tickets,setTickets]=useState([]);
  const [form,setForm]=useState({subject:"",description:"",priority:"normal"});
  const [error,setError]=useState("");
  const [working,setWorking]=useState(false);

  async function load(){
    const response=await fetch("/api/support",{cache:"no-store"});
    const result=await response.json();
    if(response.ok)setTickets(result.tickets||[]);
    else setError(result?.error||"Unable to load tickets.");
  }

  useEffect(()=>{load();},[]);

  async function submit(event){
    event.preventDefault();setWorking(true);setError("");
    try{
      const response=await fetch("/api/support",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result?.error||"Unable to create ticket.");
      setForm({subject:"",description:"",priority:"normal"});
      await load();
    }catch(err){setError(err.message);}
    finally{setWorking(false);}
  }

  return (
    <ClientShell>
      <p style={eyebrow}>HELP & SUPPORT</p>
      <h1 style={title}>Support</h1>
      <p style={muted}>Raise a ticket to the Phoniq support team and track its status.</p>

      {error&&<div style={errorStyle}>{error}</div>}

      <div style={twoColumn}>
        <form onSubmit={submit} style={card}>
          <h2>Raise a Ticket</h2>
          <label style={label}>Subject</label>
          <input style={input} required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>

          <label style={label}>Priority</label>
          <select style={input} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
            <option value="low">Low</option><option value="normal">Normal</option>
            <option value="high">High</option><option value="urgent">Urgent</option>
          </select>

          <label style={label}>Description</label>
          <textarea style={{...input,minHeight:140}} required value={form.description}
            onChange={e=>setForm({...form,description:e.target.value})}/>

          <button style={button} disabled={working}>{working?"Submitting...":"Submit Ticket"}</button>
        </form>

        <section style={card}>
          <h2>Your Tickets</h2>
          {tickets.length ? tickets.map(ticket=>(
            <div key={ticket.id} style={ticketRow}>
              <div>
                <strong>{ticket.subject}</strong>
                <div style={muted}>{ticket.description}</div>
              </div>
              <div><span style={pill}>{ticket.priority}</span>{" "}<span style={pill}>{ticket.status}</span></div>
            </div>
          )):<p style={muted}>No support tickets yet.</p>}
        </section>
      </div>
    </ClientShell>
  );
}

const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const muted={color:"#64748b",lineHeight:1.5};
const twoColumn={display:"grid",gridTemplateColumns:"minmax(320px,.85fr) 1.15fr",gap:20,marginTop:24};
const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:24};
const label={display:"block",fontWeight:800,margin:"14px 0 6px"};const input={width:"100%",boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:9,padding:11,background:"#fff"};
const button={marginTop:18,border:0,background:"#2563eb",color:"#fff",borderRadius:9,padding:"12px 16px",fontWeight:850};
const ticketRow={padding:"15px 0",borderTop:"1px solid #edf2f7",display:"grid",gap:10};const pill={display:"inline-block",background:"#f1f5f9",borderRadius:999,padding:"5px 9px",fontSize:12,fontWeight:800};
const errorStyle={marginTop:18,background:"#fff1f2",color:"#b42318",border:"1px solid #fecaca",padding:11,borderRadius:9};
