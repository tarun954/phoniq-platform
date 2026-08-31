"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/browser";

export default function InvitePage(){
  const params=useParams(); const router=useRouter(); const token=String(params?.token||"");
  const supabase=useMemo(()=>createClient(),[]);
  const [inv,setInv]=useState(null),[user,setUser]=useState(null),[busy,setBusy]=useState(false);
  const [name,setName]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [error,setError]=useState(""),[message,setMessage]=useState("");

  useEffect(()=>{ if(!token)return; (async()=>{
    try{
      const r=await fetch(`/api/team/invite/${encodeURIComponent(token)}`,{cache:"no-store"});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||"Unable to load invitation"); setInv(j.invitation);
      const {data:{user}}=await supabase.auth.getUser(); setUser(user||null);
    }catch(e){setError(e.message)}
  })(); },[token,supabase]);

  useEffect(()=>{
    if(!user||!inv||inv.status!=="pending") return;
    if((user.email||"").toLowerCase()!==(inv.email||"").toLowerCase()) return;
    accept();
  },[user,inv]);

  async function accept(){
    setBusy(true); setError("");
    try{
      const r=await fetch("/api/team/invite/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||"Unable to accept invitation");
      router.replace("/dashboard"); router.refresh();
    }catch(e){setError(e.message)} finally{setBusy(false)}
  }

  async function createAccount(){
    setBusy(true); setError(""); setMessage("");
    try{
      if(!name.trim()) throw new Error("Enter your full name.");
      if(password.length<8) throw new Error("Password must be at least 8 characters.");
      if(password!==confirm) throw new Error("Passwords do not match.");
      const emailRedirectTo=`${window.location.origin}/invite/${encodeURIComponent(token)}`;
      const {data,error}=await supabase.auth.signUp({email:inv.email,password,options:{emailRedirectTo,data:{full_name:name.trim(),invitation_token:token}}});
      if(error) throw error;
      if(!data?.session){ setMessage("Account created. Confirm your email; you will return here to finish joining."); return; }
      setUser(data.user);
    }catch(e){setError(e.message)} finally{setBusy(false)}
  }

  if(!inv) return <main style={{padding:40}}>{error||"Loading invitation..."}</main>;
  const wrong=user && (user.email||"").toLowerCase()!==(inv.email||"").toLowerCase();
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f5f7fb",padding:24}}><section style={{width:"100%",maxWidth:520,background:"#fff",border:"1px solid #dbe3ee",borderRadius:18,padding:34}}>
    <b style={{fontSize:22}}>PHONIQ</b><p style={{color:"#2563eb",fontWeight:800}}>TEAM INVITATION</p>
    <h1>Join {inv.companyName}</h1><p>Role: <b>{inv.roleName}</b></p><p>Email: <b>{inv.email}</b></p>
    {error&&<div style={{background:"#fff1f2",padding:12,color:"#b42318"}}>{error}</div>}
    {message&&<div style={{background:"#ecfdf3",padding:12,color:"#067647"}}>{message}</div>}
    {inv.status==="accepted" ? <button onClick={()=>router.push("/dashboard")}>Open Dashboard</button> : user ? wrong ? <a href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in with {inv.email}</a> : <button disabled={busy} onClick={accept}>{busy?"Joining...":"Accept & Join"}</button> : <>
      <label>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:12,margin:"6px 0 14px"}}/>
      <label>Email</label><input value={inv.email} readOnly style={{width:"100%",padding:12,margin:"6px 0 14px",background:"#f8fafc"}}/>
      <label>Create Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:12,margin:"6px 0 14px"}}/>
      <label>Confirm Password</label><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={{width:"100%",padding:12,margin:"6px 0 14px"}}/>
      <button disabled={busy} onClick={createAccount}>{busy?"Creating...":"Create Account & Join"}</button>
      <p>Already have an account? <a href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in</a></p>
    </>}
  </section></main>;
}
