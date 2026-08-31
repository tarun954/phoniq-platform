"use client";

import { useEffect, useState } from "react";
import ClientShell from "@/components/crm/ClientShell";

export default function SettingsPage() {
  const [data,setData]=useState(null);
  const [form,setForm]=useState(null);
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function load(){
    setError("");
    const response=await fetch("/api/settings",{cache:"no-store"});
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to load settings.");return;}
    setData(result);
    setForm({user:{fullName:result.user?.fullName||""},company:{...result.company}});
  }

  useEffect(()=>{load();},[]);

  function updateCompany(key,value){
    setForm(current=>({...current,company:{...current.company,[key]:value}}));
  }

  async function saveSettings(){
    setError("");setMessage("");
    const response=await fetch("/api/settings",{
      method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to save settings.");return;}
    setMessage("Settings updated.");load();
  }

  async function changePassword(){
    setError("");setMessage("");
    if(password!==confirmPassword){setError("Passwords do not match.");return;}
    const response=await fetch("/api/settings/password",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to update password.");return;}
    setPassword("");setConfirmPassword("");setMessage("Password updated.");
  }

  return (
    <ClientShell>
      <p style={eyebrow}>WORKSPACE CONFIGURATION</p>
      <h1 style={title}>Settings</h1>
      <p style={subtitle}>View your user and company information. Owners and admins can edit workspace settings.</p>

      {error&&<div style={errorStyle}>{error}</div>}
      {message&&<div style={successStyle}>{message}</div>}

      {!data||!form ? <div style={card}>Loading settings...</div> : (
        <>
          <section style={card}>
            <div style={roleBanner}>
              Current workspace role: <strong>{data.role?.name}</strong>
              {!data.canEdit&&<span> · Read-only access</span>}
            </div>

            <h2>User Information</h2>
            <div style={grid}>
              <Field label="Full name" value={form.user.fullName} disabled={!data.canEdit}
                onChange={value=>setForm(current=>({...current,user:{...current.user,fullName:value}}))}/>
              <Field label="Email" value={data.user?.email||""} disabled/>
            </div>

            <h2 style={{marginTop:30}}>Company Information</h2>
            <div style={grid}>
              <Field label="Company name" value={form.company.name} disabled={!data.canEdit} onChange={v=>updateCompany("name",v)}/>
              <Field label="Business type" value={form.company.businessType} disabled={!data.canEdit} onChange={v=>updateCompany("businessType",v)}/>
              <Field label="Website" value={form.company.website} disabled={!data.canEdit} onChange={v=>updateCompany("website",v)}/>
              <Field label="Main phone" value={form.company.mainPhone} disabled={!data.canEdit} onChange={v=>updateCompany("mainPhone",v)}/>
              <Field label="Service area" value={form.company.serviceArea} disabled={!data.canEdit} onChange={v=>updateCompany("serviceArea",v)}/>
              <Field label="Timezone" value={form.company.timezone} disabled={!data.canEdit} onChange={v=>updateCompany("timezone",v)}/>
              <Field label="Support email" value={form.company.supportEmail} disabled={!data.canEdit} onChange={v=>updateCompany("supportEmail",v)}/>
              <Field label="Support phone" value={form.company.supportPhone} disabled={!data.canEdit} onChange={v=>updateCompany("supportPhone",v)}/>
            </div>

            {data.canEdit&&<button style={primaryButton} onClick={saveSettings}>Save User & Company Info</button>}
          </section>

          {data.canEdit&&(
            <section style={card}>
              <h2>Security</h2>
              <p style={subtitle}>Update the password for your current account.</p>
              <div style={grid}>
                <Field type="password" label="New password" value={password} onChange={setPassword}/>
                <Field type="password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword}/>
              </div>
              <button style={primaryButton} onClick={changePassword}>Update Password</button>
            </section>
          )}
        </>
      )}
    </ClientShell>
  );
}

function Field({label,value,disabled=false,onChange,type="text"}){
  return (
    <label style={{display:"block"}}>
      <span style={labelStyle}>{label}</span>
      <input type={type} value={value||""} disabled={disabled}
        onChange={event=>onChange?.(event.target.value)}
        style={{...inputStyle,background:disabled?"#f8fafc":"#fff",color:disabled?"#64748b":"#0f172a"}}/>
    </label>
  );
}

const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const subtitle={color:"#64748b",lineHeight:1.5};
const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:24,marginTop:24};
const roleBanner={background:"#f8fafc",borderRadius:11,padding:14,color:"#64748b",marginBottom:24};
const grid={display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16};
const labelStyle={display:"block",fontSize:13,fontWeight:800,marginBottom:7,color:"#334155"};
const inputStyle={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"1px solid #cbd5e1",borderRadius:10};
const primaryButton={marginTop:20,border:0,background:"#2563eb",color:"#fff",borderRadius:10,padding:"12px 16px",fontWeight:850,cursor:"pointer"};
const errorStyle={padding:12,marginTop:18,background:"#fff1f2",border:"1px solid #fecaca",color:"#b42318",borderRadius:10};
const successStyle={padding:12,marginTop:18,background:"#ecfdf3",border:"1px solid #bbf7d0",color:"#067647",borderRadius:10};
