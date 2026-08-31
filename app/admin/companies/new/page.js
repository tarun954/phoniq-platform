"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewCompanyPage() {
  const [form,setForm]=useState({
    companyName:"",
    industry:"HVAC",
    ownerName:"",
    ownerEmail:"",
    ownerPhone:"",
    companyPhone:"",
    website:"",
    timezone:"America/Chicago",
  });
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);

  function update(key,value){
    setForm((current)=>({...current,[key]:value}));
  }

  async function submit(event){
    event.preventDefault();
    setWorking(true);
    setError("");
    setResult(null);

    try{
      const response=await fetch("/api/admin/companies",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(form),
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error||"Unable to create company.");
      setResult(data);
    }catch(err){
      setError(err?.message||"Unable to create company.");
    }finally{
      setWorking(false);
    }
  }

  return (
    <>
      <p style={{color:"#2563eb",fontWeight:900,fontSize:12}}>CLIENT ONBOARDING</p>
      <h1 style={{fontSize:38,margin:"6px 0"}}>Add Company</h1>
      <p style={{color:"#64748b"}}>Create a tenant workspace and invite its owner.</p>

      {error&&<div style={errorStyle}>{error}</div>}

      {result ? (
        <div style={card}>
          <h2>Company created</h2>
          <p><strong>{result.company?.name}</strong></p>
          <p>Organization ID: {result.company?.id}</p>
          {result.inviteUrl&&(
            <>
              <label style={label}>Owner Invitation URL</label>
              <input style={input} readOnly value={result.inviteUrl}/>
              <button style={button} onClick={()=>navigator.clipboard.writeText(result.inviteUrl)}>Copy Invitation Link</button>
            </>
          )}
          <div style={{marginTop:20}}>
            <Link href={`/admin/companies/${result.company?.id}`}>Open Company 360</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={card}>
          {[
            ["companyName","Company Name","text",true],
            ["website","Website","url",false],
            ["companyPhone","Company Phone","tel",false],
            ["ownerName","Owner Name","text",true],
            ["ownerEmail","Owner Email","email",true],
            ["ownerPhone","Owner Phone","tel",false],
          ].map(([key,labelText,type,required])=>(
            <div key={key}>
              <label style={label}>{labelText}</label>
              <input style={input} type={type} required={required} value={form[key]} onChange={(e)=>update(key,e.target.value)}/>
            </div>
          ))}

          <label style={label}>Industry</label>
          <select style={input} value={form.industry} onChange={(e)=>update("industry",e.target.value)}>
            <option>HVAC</option>
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>Roofing</option>
            <option>Home Services</option>
            <option>Other</option>
          </select>

          <label style={label}>Timezone</label>
          <select style={input} value={form.timezone} onChange={(e)=>update("timezone",e.target.value)}>
            <option value="America/Chicago">Central Time</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>

          <button style={button} disabled={working}>
            {working?"Creating Company...":"Create Company & Owner Invitation"}
          </button>
        </form>
      )}
    </>
  );
}

const card={maxWidth:720,background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:24,marginTop:24};
const label={display:"block",fontWeight:800,margin:"14px 0 6px"};
const input={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #cbd5e1",borderRadius:9,background:"#fff"};
const button={marginTop:20,padding:"12px 16px",border:"1px solid #1d4ed8",borderRadius:10,background:"#2563eb",color:"#fff",fontWeight:800,cursor:"pointer"};
const errorStyle={maxWidth:720,background:"#fff1f2",border:"1px solid #fecaca",color:"#b42318",padding:12,borderRadius:10,marginTop:18};
