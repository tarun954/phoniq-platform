"use client";

import { useState } from "react";

export default function MockPaymentPage(){
  const [planKey,setPlanKey]=useState("starter");
  const [working,setWorking]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  async function pay(){
    setWorking(true);setError("");
    try{
      const response=await fetch("/api/onboarding/mock-payment",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planKey})
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||"Payment test failed.");
      setResult(data);
    }catch(err){setError(err.message);}
    finally{setWorking(false);}
  }

  return (
    <main style={{minHeight:"100vh",background:"#f6f8fc",padding:40}}>
      <div style={{maxWidth:760,margin:"auto"}}>
        <p style={{color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5}}>TEST ONBOARDING</p>
        <h1>Dummy Payment</h1>
        <p style={{color:"#64748b"}}>
          This is a mock payment so we can validate subscription and onboarding state before connecting a real payment processor.
        </p>

        <section style={{background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:24,marginTop:24}}>
          {error&&<div style={{color:"#b42318"}}>{error}</div>}
          {result ? (
            <>
              <h2>Payment simulation successful</h2>
              <p>Plan: {result.subscription?.plan_key}</p>
              <p>Status: {result.subscription?.status}</p>
              <a href="/dashboard">Continue to Dashboard</a>
            </>
          ) : (
            <>
              <label style={{display:"block",fontWeight:800,marginBottom:7}}>Plan</label>
              <select value={planKey} onChange={e=>setPlanKey(e.target.value)} style={{width:"100%",padding:11}}>
                <option value="starter">Starter — $99/month test structure</option>
                <option value="growth">Growth — $199/month test structure</option>
                <option value="pro">Pro — $349/month test structure</option>
              </select>
              <button onClick={pay} disabled={working}
                style={{marginTop:18,background:"#2563eb",color:"#fff",border:0,borderRadius:9,padding:"12px 16px",fontWeight:850}}>
                {working?"Processing...":"Simulate Successful Payment"}
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
