"use client";

import { useEffect,useMemo,useState } from "react";
import { useParams } from "next/navigation";

export default function CompanyAccessPage(){
  const {id}=useParams();
  const [data,setData]=useState(null);
  const [selectedRoleId,setSelectedRoleId]=useState("");
  const [selected,setSelected]=useState(new Set());
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    setError("");
    const response=await fetch(`/api/admin/companies/${id}/access`,{cache:"no-store"});
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to load company access.");return;}
    setData(result);

    const first=(result.roles||[]).find(r=>String(r.role_key||"").toLowerCase()!=="owner");
    if(first){
      setSelectedRoleId(current=>current||first.id);
    }
  }

  useEffect(()=>{load();},[id]);

  useEffect(()=>{
    if(!data||!selectedRoleId)return;
    setSelected(new Set(
      (data.rolePermissions||[])
        .filter(row=>row.role_id===selectedRoleId)
        .map(row=>row.permission_id)
    ));
  },[data,selectedRoleId]);

  const groups=useMemo(()=>{
    const map=new Map();
    for(const p of data?.permissions||[]){
      const category=p.category||"Other";
      if(!map.has(category))map.set(category,[]);
      map.get(category).push(p);
    }
    return Array.from(map.entries());
  },[data]);

  function toggle(permissionId,checked){
    setSelected(current=>{
      const next=new Set(current);
      if(checked)next.add(permissionId);else next.delete(permissionId);
      return next;
    });
  }

  async function save(){
    setError("");setMessage("");
    const response=await fetch(`/api/admin/companies/${id}/access`,{
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({roleId:selectedRoleId,permissionIds:Array.from(selected)})
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to save permissions.");return;}
    setMessage("Company role permissions updated.");
    load();
  }

  return (
    <>
      <p style={eyebrow}>CLIENT COMPANY ACCESS</p>
      <h1 style={title}>{data?.company?.name || "Company"} Permissions</h1>
      <p style={muted}>
        Phoniq platform admins can support and configure the roles of this onboarded client without mixing them with Phoniq internal roles.
      </p>

      {error&&<div style={errorBox}>{error}</div>}
      {message&&<div style={successBox}>{message}</div>}

      {!data?<div style={card}>Loading...</div>:(
        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,marginTop:24}}>
          <section style={card}>
            <h2>Client Roles</h2>
            {(data.roles||[]).map(role=>(
              <button key={role.id} onClick={()=>setSelectedRoleId(role.id)}
                disabled={String(role.role_key||"").toLowerCase()==="owner"}
                style={{
                  width:"100%",textAlign:"left",padding:12,margin:"5px 0",
                  border:"1px solid #dce4ef",borderRadius:9,
                  background:selectedRoleId===role.id?"#eff6ff":"#fff",
                  color:selectedRoleId===role.id?"#1458e6":"#0f172a",
                  fontWeight:800
                }}>
                {role.name}
                {String(role.role_key||"").toLowerCase()==="owner"&&<small style={{display:"block",color:"#94a3b8"}}>Full access</small>}
              </button>
            ))}

            <h2 style={{marginTop:26}}>Members</h2>
            {(data.members||[]).map(member=>(
              <div key={member.id} style={{padding:"9px 0",borderTop:"1px solid #eef2f7"}}>
                <strong>{String(member.user_id).slice(0,8)}…</strong>
                <small style={{display:"block",color:"#94a3b8"}}>{member.role||"member"}</small>
              </div>
            ))}
          </section>

          <section style={card}>
            <h2>Edit Role Permissions</h2>
            <p style={muted}>Includes both feature permissions and sidebar view/hide permissions.</p>

            {groups.map(([category,permissions])=>(
              <div key={category} style={{borderTop:"1px solid #eef2f7",paddingTop:12,marginTop:12}}>
                <h3>{category}</h3>
                {permissions.map(permission=>(
                  <label key={permission.id} style={{display:"grid",gridTemplateColumns:"22px 1fr",gap:10,padding:"8px 0"}}>
                    <input type="checkbox" checked={selected.has(permission.id)}
                      onChange={e=>toggle(permission.id,e.target.checked)}/>
                    <span>
                      <strong>{permission.name}</strong>
                      <small style={{display:"block",color:"#94a3b8"}}>{permission.permission_key}</small>
                    </span>
                  </label>
                ))}
              </div>
            ))}

            <button style={button} onClick={save} disabled={!selectedRoleId}>Save Client Role Permissions</button>
          </section>
        </div>
      )}
    </>
  );
}

const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const muted={color:"#64748b",lineHeight:1.5};
const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:22};
const button={marginTop:20,background:"#2563eb",color:"#fff",border:0,borderRadius:9,padding:"12px 16px",fontWeight:850};
const errorBox={marginTop:16,padding:11,background:"#fff1f2",border:"1px solid #fecaca",color:"#b42318",borderRadius:9};
const successBox={marginTop:16,padding:11,background:"#ecfdf3",border:"1px solid #bbf7d0",color:"#067647",borderRadius:9};
