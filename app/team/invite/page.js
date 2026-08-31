"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/crm/ClientShell";

export default function TeamInvitePage() {
  const [roles,setRoles]=useState([]);
  const [email,setEmail]=useState("");
  const [roleId,setRoleId]=useState("");
  const [working,setWorking]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    fetch("/api/roles",{cache:"no-store"})
      .then(async r=>({ok:r.ok,data:await r.json()}))
      .then(({ok,data})=>{
        if(!ok) throw new Error(data?.error||"Unable to load roles.");
        setRoles(data?.roles||data?.data||(Array.isArray(data)?data:[]));
      })
      .catch(e=>setError(e.message));
  },[]);

  async function submit(event){
    event.preventDefault();setWorking(true);setError("");
    try{
      const response=await fetch("/api/team/invite",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:email.trim().toLowerCase(),roleId})
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error||"Unable to invite member.");
      setResult(data);
    }catch(err){setError(err?.message||"Unable to invite member.");}
    finally{setWorking(false);}
  }

  return (
    <ClientShell>
      <p style={{color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5}}>TEAM</p>
      <h1 style={{fontSize:38,margin:"6px 0"}}>Invite Member</h1>
      <p style={{color:"#64748b"}}>Invite an employee into this company workspace.</p>

      <form onSubmit={submit} style={card}>
        {error&&<div style={errorStyle}>{error}</div>}
        {result ? (
          <>
            <h2>Invitation created</h2>
            <p>{result.emailSent===false?"Email could not be delivered. Use the invite URL for testing.":"Invitation email sent."}</p>
            {result.inviteUrl&&<input style={input} readOnly value={result.inviteUrl}/>}
          </>
        ) : (
          <>
            <label style={label}>Employee email</label>
            <input style={input} required type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <label style={label}>Role</label>
            <select style={input} required value={roleId} onChange={e=>setRoleId(e.target.value)}>
              <option value="">Select a role</option>
              {roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <button style={button} disabled={working}>{working?"Sending...":"Send Invitation"}</button>
          </>
        )}
      </form>
    </ClientShell>
  );
}
const card={maxWidth:620,background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:24,marginTop:24};
const label={display:"block",fontWeight:800,margin:"14px 0 6px"};const input={width:"100%",boxSizing:"border-box",padding:11,border:"1px solid #cbd5e1",borderRadius:9};
const button={marginTop:18,background:"#2563eb",color:"#fff",border:0,padding:"12px 16px",borderRadius:9,fontWeight:800};
const errorStyle={background:"#fff1f2",color:"#b42318",border:"1px solid #fecaca",padding:11,borderRadius:9};
