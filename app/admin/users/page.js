"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlatformPermissionEditor from "@/components/admin/PlatformPermissionEditor";

export default function AdminUsersPage(){
  const [users,setUsers]=useState([]);
  const [selected,setSelected]=useState(null);
  const [error,setError]=useState("");

  async function load(){
    const response=await fetch("/api/admin/users",{cache:"no-store"});
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to load Phoniq team.");return;}
    setUsers(result.users||[]);
  }

  useEffect(()=>{load();},[]);

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",gap:18}}>
        <div>
          <p style={eyebrow}>PHONIQ INTERNAL TEAM</p>
          <h1 style={title}>Admin Console Users</h1>
          <p style={muted}>Manage internal platform employees and their access.</p>
        </div>
        <Link href="/admin/users/invite" style={linkButton}>+ Invite Employee</Link>
      </div>

      {error&&<div>{error}</div>}

      <section style={card}>
        {users.map(user=>(
          <div key={user.user_id} style={row}>
            <div><strong>{user.user_id}</strong><div style={muted}>{prettyRole(user.role)}</div></div>
            <span>{user.active?"Active":"Disabled"}</span>
            <div>
              {user.role==="super_admin"?
                <span style={muted}>Full access</span>:
                <button onClick={()=>setSelected(user.user_id)}>Edit Access</button>}
            </div>
          </div>
        ))}
      </section>

      {selected&&(
        <PlatformPermissionEditor userId={selected}
          onClose={()=>{setSelected(null);load();}}/>
      )}
    </>
  );
}

function prettyRole(role){
  return ({super_admin:"Super Host",platform_admin:"Admin",sales:"Sales Employee",support:"Support",operations:"Operations"})[role]||role;
}

const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0};
const title={fontSize:40,margin:"7px 0"};const muted={color:"#64748b",lineHeight:1.5};
const linkButton={height:"fit-content",background:"#2563eb",color:"#fff",textDecoration:"none",borderRadius:10,padding:"12px 16px",fontWeight:850};
const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,overflow:"hidden",marginTop:24};
const row={display:"grid",gridTemplateColumns:"2fr .8fr 1fr",gap:16,alignItems:"center",padding:18,borderTop:"1px solid #edf2f7"};
