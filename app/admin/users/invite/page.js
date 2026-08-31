"use client";

import { useEffect, useState } from "react";

export default function AdminInvitePage(){
  const [email,setEmail]=useState("");
  const [roleType,setRoleType]=useState("admin");
  const [customRoleName,setCustomRoleName]=useState("");
  const [permissions,setPermissions]=useState([]);
  const [selected,setSelected]=useState([]);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    fetch("/api/admin/platform-permissions")
      .then(r=>r.json()).then(data=>setPermissions(data.permissions||[])).catch(()=>{});
  },[]);

  async function submit(event){
    event.preventDefault();setError("");
    const response=await fetch("/api/admin/users/invite",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,roleType,customRoleName,permissionKeys:selected})
    });
    const data=await response.json();
    if(!response.ok){setError(data?.error||"Unable to invite employee.");return;}
    setResult(data);
  }

  return (
    <>
      <p style={eyebrow}>PHONIQ TEAM</p>
      <h1 style={title}>Invite Internal Employee</h1>
      <p style={muted}>Invite people to the Phoniq Admin Console, separate from client CRM users.</p>

      <form onSubmit={submit} style={card}>
        {error&&<div style={errorStyle}>{error}</div>}

        {result ? (
          <>
            <h2>Invitation created</h2>
            <p style={muted}>{result.emailSent?"Invitation email sent.":"Use the URL below for testing."}</p>
            <input style={input} readOnly value={result.inviteUrl||""}/>
          </>
        ) : (
          <>
            <label style={label}>Employee email</label>
            <input style={input} required type="email" value={email} onChange={e=>setEmail(e.target.value)}/>

            <label style={label}>Internal role</label>
            <select style={input} value={roleType} onChange={e=>setRoleType(e.target.value)}>
              <option value="super_host">Super Host</option>
              <option value="admin">Admin</option>
              <option value="sales">Sales Employee</option>
              <option value="support">Support</option>
              <option value="operations">Operations</option>
              <option value="custom">Custom Role</option>
            </select>

            {roleType==="custom"&&(
              <>
                <label style={label}>Custom role name</label>
                <input style={input} value={customRoleName} onChange={e=>setCustomRoleName(e.target.value)}/>
                <h3 style={{marginTop:22}}>Custom Permissions</h3>
                {permissions.map(permission=>(
                  <label key={permission.permission_key} style={{display:"block",padding:"7px 0"}}>
                    <input type="checkbox" checked={selected.includes(permission.permission_key)}
                      onChange={e=>setSelected(current=>e.target.checked?[...current,permission.permission_key]:current.filter(key=>key!==permission.permission_key))}/>
                    {" "}{permission.name}
                  </label>
                ))}
              </>
            )}

            <button style={button}>Create Admin Invitation</button>
          </>
        )}
      </form>
    </>
  );
}

const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const muted={color:"#64748b",lineHeight:1.5};
const card={maxWidth:720,background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:24,marginTop:24};
const label={display:"block",fontWeight:800,margin:"14px 0 6px"};const input={width:"100%",boxSizing:"border-box",border:"1px solid #cbd5e1",borderRadius:9,padding:11};
const button={marginTop:20,background:"#2563eb",border:0,color:"#fff",borderRadius:9,padding:"12px 16px",fontWeight:850};
const errorStyle={background:"#fff1f2",border:"1px solid #fecaca",color:"#b42318",padding:11,borderRadius:9};
