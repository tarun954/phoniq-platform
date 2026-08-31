"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminNotificationToastHost(){
  const seen=useRef(new Set());
  const [toasts,setToasts]=useState([]);

  useEffect(()=>{
    let mounted=true;
    async function poll(){
      try{
        const response=await fetch("/api/admin/notifications",{cache:"no-store"});
        const result=await response.json();
        if(!response.ok||!mounted)return;

        const fresh=[];
        for(const item of result.notifications||[]){
          if(!seen.current.has(item.id)){
            seen.current.add(item.id);
            if(!item.read)fresh.push(item);
          }
        }

        if(fresh.length)setToasts(current=>[...fresh.slice(0,3),...current].slice(0,4));
      }catch{}
    }
    poll();
    const timer=setInterval(poll,10000);
    return()=>{mounted=false;clearInterval(timer);};
  },[]);

  useEffect(()=>{
    if(!toasts.length)return;
    const timer=setTimeout(()=>setToasts(current=>current.slice(0,-1)),6500);
    return()=>clearTimeout(timer);
  },[toasts]);

  return (
    <div className="admin-toast-stack">
      {toasts.map(item=>(
        <a key={item.id} href={item.href||"#"} className="admin-toast">
          <span className="admin-toast-dot"/>
          <div><strong>{item.title}</strong><p>{item.message}</p></div>
        </a>
      ))}
      <style jsx global>{`
        .admin-toast-stack{position:fixed;right:24px;top:94px;z-index:15000;display:grid;gap:10px;width:min(390px,calc(100vw - 40px))}
        .admin-toast{display:grid;grid-template-columns:12px 1fr;gap:12px;background:#fff;border:1px solid #dbe4ef;border-radius:14px;padding:15px;text-decoration:none;color:#0f172a;box-shadow:0 18px 55px rgba(15,23,42,.18);animation:adminToastIn .36s ease-out}
        .admin-toast p{margin:4px 0 0;color:#64748b}.admin-toast-dot{width:10px;height:10px;border-radius:99px;background:#f59e0b;margin-top:4px;animation:adminPulse 1.35s infinite}
        @keyframes adminToastIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}@keyframes adminPulse{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}70%{box-shadow:0 0 0 10px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}
      `}</style>
    </div>
  );
}
