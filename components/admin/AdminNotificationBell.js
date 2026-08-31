"use client";

import { useEffect, useState } from "react";

export default function AdminNotificationBell() {
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);

  async function load(){
    try{
      const response=await fetch("/api/admin/notifications",{cache:"no-store"});
      const result=await response.json();
      if(response.ok)setItems(result.notifications||[]);
    }catch{}
  }

  useEffect(()=>{
    load();
    const timer=setInterval(load,10000);
    return ()=>clearInterval(timer);
  },[]);

  const unread=items.filter(item=>!item.read).length;

  async function mark(id){
    await fetch("/api/admin/notifications",{
      method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})
    });
    load();
  }

  return (
    <div className="admin-bell-wrap">
      <button className="admin-bell-btn" onClick={()=>setOpen(!open)} aria-label="Admin notifications">
        🔔 {unread>0&&<span>{unread}</span>}
      </button>

      {open&&(
        <div className="admin-bell-menu">
          <strong>Notifications</strong>
          {items.length ? items.slice(0,8).map(item=>(
            <a key={item.id} href={item.href||"#"} className={item.read?"read":""} onClick={()=>mark(item.id)}>
              <b>{item.title}</b>
              <small>{item.message}</small>
            </a>
          )):<p>No notifications.</p>}
        </div>
      )}

      <style jsx global>{`
        .admin-bell-wrap{position:relative}.admin-bell-btn{position:relative;border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:10px 12px;cursor:pointer}
        .admin-bell-btn span{position:absolute;right:-5px;top:-7px;background:#dc2626;color:#fff;border-radius:999px;min-width:18px;height:18px;display:grid;place-items:center;font-size:10px;font-weight:900}
        .admin-bell-menu{position:absolute;right:0;top:50px;width:360px;background:#fff;border:1px solid #dce4ef;border-radius:12px;padding:14px;box-shadow:0 20px 60px rgba(15,23,42,.18);z-index:12000}
        .admin-bell-menu>a{display:block;text-decoration:none;color:#0f172a;padding:11px 0;border-top:1px solid #eef2f7}.admin-bell-menu>a.read{opacity:.58}.admin-bell-menu small{display:block;color:#64748b;margin-top:4px;line-height:1.35}
      `}</style>
    </div>
  );
}
