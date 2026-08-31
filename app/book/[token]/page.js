"use client";

import { useEffect,useState } from "react";
import { useParams } from "next/navigation";

export default function BookingPage(){
  const {token}=useParams();
  const [data,setData]=useState(null);
  const [selected,setSelected]=useState("");
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(null);
  const [working,setWorking]=useState(false);

  async function load(){
    const response=await fetch(`/api/booking/${token}`,{cache:"no-store"});
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to load booking.");return;}
    setData(result);
  }

  useEffect(()=>{load();},[token]);

  async function book(){
    if(!selected)return;
    setWorking(true);setError("");

    const response=await fetch(`/api/booking/${token}`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({scheduledAt:selected})
    });
    const result=await response.json();

    if(!response.ok){setError(result?.error||"Unable to book appointment.");setWorking(false);return;}
    setSuccess(result);setWorking(false);
  }

  return (
    <main style={{minHeight:"100vh",background:"#f6f8fc",padding:30}}>
      <section style={{maxWidth:760,margin:"40px auto",background:"#fff",border:"1px solid #dce4ef",borderRadius:20,padding:28}}>
        <strong>PHONIQ</strong>

        {error&&<div style={{marginTop:18,color:"#b42318"}}>{error}</div>}

        {success ? (
          <>
            <h1>Appointment confirmed</h1>
            <p>Your appointment has been saved. Confirmation notifications are being sent.</p>
          </>
        ) : data ? (
          <>
            <p style={{color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,marginTop:26}}>SELECT APPOINTMENT</p>
            <h1>{data.booking.companyName}</h1>
            <p>Hello {data.booking.customerName}. Choose an available service time.</p>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginTop:22}}>
              {data.slots.map(slot=>(
                <button key={slot} onClick={()=>setSelected(slot)}
                  style={{
                    padding:13,borderRadius:10,cursor:"pointer",
                    border:selected===slot?"2px solid #2563eb":"1px solid #cbd5e1",
                    background:selected===slot?"#eff6ff":"#fff",
                    fontWeight:750
                  }}>
                  {new Date(slot).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
                </button>
              ))}
            </div>

            <button disabled={!selected||working} onClick={book}
              style={{marginTop:22,width:"100%",padding:13,border:0,borderRadius:10,background:"#2563eb",color:"#fff",fontWeight:850}}>
              {working?"Booking...":"Confirm Appointment"}
            </button>
          </>
        ) : <p>Loading available appointments...</p>}
      </section>
    </main>
  );
}
