"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AdminInviteAcceptPage(){
  const params=useParams();
  const router=useRouter();
  const token=String(params?.token||"");
  const supabase=useMemo(()=>createClient(),[]);

  const [invite,setInvite]=useState(null);
  const [user,setUser]=useState(null);
  const [fullName,setFullName]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{
    async function load(){
      const response=await fetch(`/api/admin/invite/${token}`);
      const result=await response.json();
      if(!response.ok){setError(result?.error||"Invitation unavailable.");return;}
      setInvite(result.invitation);
      const {data:{user}}=await supabase.auth.getUser();
      setUser(user||null);
    }
    load();
  },[token,supabase]);

  async function accept(){
    const response=await fetch("/api/admin/invite/accept",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to accept invitation.");return;}
    router.replace("/admin");router.refresh();
  }

  useEffect(()=>{
    if(user&&invite?.status==="pending")accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user,invite]);

  async function createAccount(){
    setError("");
    const redirectTo=`${window.location.origin}/admin-invite/${token}`;
    const {data,error}=await supabase.auth.signUp({
      email:invite.email,
      password,
      options:{emailRedirectTo:redirectTo,data:{full_name:fullName,platform_invitation_token:token}}
    });
    if(error){setError(error.message);return;}
    if(data.session)setUser(data.user);
    else setMessage("Account created. Confirm your email; you will return to this invitation.");
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f6f8fc",padding:24}}>
      <section style={{width:"min(520px,100%)",background:"#fff",border:"1px solid #dce4ef",borderRadius:18,padding:28}}>
        <strong>PHONIQ</strong>
        <p style={{color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,marginTop:24}}>INTERNAL TEAM INVITATION</p>
        <h1>Join the Phoniq Admin Console</h1>
        {error&&<div style={{color:"#b42318"}}>{error}</div>}
        {message&&<div style={{color:"#067647"}}>{message}</div>}

        {invite&&!user&&(
          <>
            <p>You were invited as <strong>{invite.displayRole}</strong>.</p>
            <input style={input} readOnly value={invite.email}/>
            <input style={input} placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>
            <input style={input} type="password" placeholder="Create password" value={password} onChange={e=>setPassword(e.target.value)}/>
            <button style={button} onClick={createAccount}>Create Account & Join</button>
          </>
        )}

        {user&&<p>Finishing your internal access...</p>}
      </section>
    </main>
  );
}
const input={width:"100%",boxSizing:"border-box",padding:11,border:"1px solid #cbd5e1",borderRadius:9,marginTop:12};
const button={width:"100%",marginTop:16,padding:12,border:0,borderRadius:9,background:"#2563eb",color:"#fff",fontWeight:850};
