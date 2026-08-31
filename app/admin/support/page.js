"use client";

import { useEffect, useState } from "react";

export default function AdminSupportPage(){
  const [tickets,setTickets]=useState([]);
  const [assignees,setAssignees]=useState([]);
  const [error,setError]=useState("");

  async function load(){
    const response=await fetch("/api/admin/support",{cache:"no-store"});
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to load support.");return;}
    setTickets(result.tickets||[]);setAssignees(result.assignees||[]);
  }

  useEffect(()=>{load();},[]);

  async function update(ticketId,field,value){
    const response=await fetch("/api/admin/support",{
      method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id:ticketId,[field]:value})
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to update ticket.");return;}
    load();
  }

  return (
    <>
      <p style={eyebrow}>BUSINESS</p>
      <h1 style={title}>Support Tickets</h1>
      <p style={muted}>Tickets raised by client companies arrive here. Assign a Phoniq employee and update status.</p>
      {error&&<div style={errorStyle}>{error}</div>}

      <section style={card}>
        {tickets.length?tickets.map(ticket=>(
          <div key={ticket.id} style={row}>
            <div>
              <strong>{ticket.subject}</strong>
              <div style={muted}>{ticket.organizations?.name||"Client company"}</div>
              <div style={{...muted,marginTop:7}}>{ticket.description}</div>
            </div>
            <div>
              <label style={smallLabel}>Assigned to</label>
              <select style={select} value={ticket.assigned_to||""} onChange={e=>update(ticket.id,"assignedTo",e.target.value)}>
                <option value="">Unassigned</option>
                {assignees.map(user=><option key={user.user_id} value={user.user_id}>{user.role} · {user.user_id.slice(0,8)}</option>)}
              </select>
            </div>
            <div>
              <label style={smallLabel}>Status</label>
              <select style={select} value={ticket.status} onChange={e=>update(ticket.id,"status",e.target.value)}>
                <option value="open">Open</option><option value="in_progress">In progress</option>
                <option value="waiting_customer">Waiting customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
              </select>
            </div>
          </div>
        )):<p style={muted}>No tickets.</p>}
      </section>
    </>
  );
}
const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const muted={color:"#64748b",lineHeight:1.5};
const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,overflow:"hidden",marginTop:24};
const row={display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:18,padding:18,borderTop:"1px solid #edf2f7",alignItems:"center"};
const smallLabel={display:"block",fontSize:11,fontWeight:900,color:"#64748b",marginBottom:6};
const select={width:"100%",border:"1px solid #cbd5e1",borderRadius:8,padding:9,background:"#fff"};
const errorStyle={marginTop:18,padding:11,background:"#fff1f2",border:"1px solid #fecaca",color:"#b42318",borderRadius:9};
