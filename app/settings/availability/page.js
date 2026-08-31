"use client";

import { useEffect,useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

const names=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function AvailabilityPage(){
  const [days,setDays]=useState(names.map((name,weekday)=>({
    weekday,name,enabled:weekday>=1&&weekday<=4,startTime:"09:00",endTime:"17:00",slotMinutes:60
  })));
  const [canEdit,setCanEdit]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{
    fetch("/api/settings/availability",{cache:"no-store"})
      .then(async r=>({ok:r.ok,data:await r.json()}))
      .then(({ok,data})=>{
        if(!ok)throw new Error(data?.error||"Unable to load availability.");
        setCanEdit(Boolean(data.canEdit));
        const map=new Map((data.availability||[]).map(d=>[Number(d.weekday),d]));
        setDays(current=>current.map(day=>{
          const saved=map.get(day.weekday);
          return saved?{
            ...day,enabled:saved.enabled,
            startTime:String(saved.start_time||"09:00").slice(0,5),
            endTime:String(saved.end_time||"17:00").slice(0,5),
            slotMinutes:Number(saved.slot_minutes)||60
          }:day;
        }));
      }).catch(e=>setError(e.message));
  },[]);

  function update(index,key,value){
    setDays(current=>current.map((day,i)=>i===index?{...day,[key]:value}:day));
  }

  async function save(){
    setError("");setMessage("");
    const response=await fetch("/api/settings/availability",{
      method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({days})
    });
    const result=await response.json();
    if(!response.ok){setError(result?.error||"Unable to save availability.");return;}
    setMessage("Availability saved.");
  }

  return (
    <CRMPageShell eyebrow="SCHEDULING" title="Company Availability"
      description="Choose the days and times customers can book appointments.">
      {error&&<div style={errorStyle}>{error}</div>}
      {message&&<div style={successStyle}>{message}</div>}

      <section style={card}>
        {days.map((day,index)=>(
          <div key={day.weekday} style={row}>
            <label><input type="checkbox" disabled={!canEdit} checked={day.enabled}
              onChange={e=>update(index,"enabled",e.target.checked)}/> <strong>{day.name}</strong></label>

            <input type="time" disabled={!canEdit||!day.enabled} value={day.startTime}
              onChange={e=>update(index,"startTime",e.target.value)}/>
            <span>to</span>
            <input type="time" disabled={!canEdit||!day.enabled} value={day.endTime}
              onChange={e=>update(index,"endTime",e.target.value)}/>
            <select disabled={!canEdit||!day.enabled} value={day.slotMinutes}
              onChange={e=>update(index,"slotMinutes",Number(e.target.value))}>
              <option value={30}>30 min</option><option value={60}>60 min</option><option value={90}>90 min</option><option value={120}>120 min</option>
            </select>
          </div>
        ))}

        {canEdit?<button style={button} onClick={save}>Save Availability</button>:
          <p style={{color:"#64748b"}}>Your role can view this schedule but cannot edit it.</p>}
      </section>
    </CRMPageShell>
  );
}

const card={background:"#fff",border:"1px solid #dce4ef",borderRadius:16,padding:24};
const row={display:"grid",gridTemplateColumns:"1.2fr 1fr auto 1fr 1fr",gap:12,alignItems:"center",padding:"13px 0",borderTop:"1px solid #eef2f7"};
const button={marginTop:20,background:"#2563eb",color:"#fff",border:0,borderRadius:9,padding:"12px 16px",fontWeight:850};
const errorStyle={padding:11,background:"#fff1f2",color:"#b42318",border:"1px solid #fecaca",borderRadius:9,marginBottom:14};
const successStyle={padding:11,background:"#ecfdf3",color:"#067647",border:"1px solid #bbf7d0",borderRadius:9,marginBottom:14};
