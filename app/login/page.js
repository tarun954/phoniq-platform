"use client";

import { Suspense,useState } from "react";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function ClientLoginForm(){
  const router=useRouter();
  const searchParams=useSearchParams();
  const next=searchParams.get("next")||"/dashboard";
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [working,setWorking]=useState(false);

  async function submit(event){
    event.preventDefault();setWorking(true);setError("");
    const supabase=createClient();

    try{
      const {error:signInError}=await supabase.auth.signInWithPassword({
        email:email.trim().toLowerCase(),password
      });
      if(signInError)throw signInError;

      const membership=await fetch("/api/navigation-permissions",{cache:"no-store"});
      if(!membership.ok){
        await supabase.auth.signOut();
        throw new Error("This account is not connected to a client company.");
      }

      await fetch("/api/auth/portal-mode",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"client"})
      });

      router.replace(next.startsWith("/admin")?"/dashboard":next);
      router.refresh();
    }catch(err){
      setError(err?.message||"Unable to sign in.");
    }finally{setWorking(false);}
  }

  return (
    <main style={page}>
      <section style={card}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={logo}>P</div>
          <div><strong style={{fontSize:18}}>PHONIQ</strong><small style={small}>CLIENT CRM</small></div>
        </div>
        <p style={eyebrow}>CLIENT SIGN IN</p>
        <h1 style={{fontSize:34,margin:"6px 0"}}>Welcome back</h1>
        <p style={{color:"#64748b"}}>Sign in to your company workspace.</p>
        {error&&<div style={errBox}>{error}</div>}
        <form onSubmit={submit}>
          <label style={label}>Email</label>
          <input style={input} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
          <label style={label}>Password</label>
          <input style={input} type="password" required value={password} onChange={e=>setPassword(e.target.value)}/>
          <button style={button} disabled={working}>{working?"Signing in...":"Sign In to Client CRM"}</button>
        </form>
        <p style={{marginTop:18,color:"#64748b",fontSize:13}}>
          Phoniq employee? <Link href="/admin-login">Use Admin Console login</Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage(){
  return <Suspense fallback={<main style={page}>Loading...</main>}><ClientLoginForm/></Suspense>;
}

const page={minHeight:"100vh",display:"grid",placeItems:"center",background:"#f6f8fc",padding:24,fontFamily:"var(--font-geist-sans),Arial,sans-serif"};
const card={width:"min(460px,100%)",background:"#fff",border:"1px solid #dce4ef",borderRadius:20,padding:30,boxShadow:"0 24px 70px rgba(15,23,42,.08)"};
const logo={width:44,height:44,borderRadius:12,display:"grid",placeItems:"center",background:"#2563eb",color:"#fff",fontWeight:900};
const small={display:"block",color:"#94a3b8",fontSize:9,letterSpacing:1.6,marginTop:3};
const eyebrow={color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:"28px 0 0"};
const label={display:"block",fontWeight:800,margin:"14px 0 6px"};const input={width:"100%",boxSizing:"border-box",padding:12,border:"1.5px solid #0f172a",borderRadius:9};
const button={width:"100%",marginTop:20,padding:12,border:"1.5px solid #0f172a",borderRadius:9,background:"#2563eb",color:"#fff",fontWeight:850};
const errBox={marginTop:15,padding:11,border:"1px solid #fecaca",background:"#fff1f2",color:"#b42318",borderRadius:9};
