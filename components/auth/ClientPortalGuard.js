"use client";

import { useEffect, useState } from "react";

export default function ClientPortalGuard({children}){
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    fetch("/api/auth/portal-mode",{cache:"no-store"})
      .then(r=>r.json())
      .then(data=>{
        if(data.mode!=="client"){
          window.location.href="/login";
          return;
        }
        setReady(true);
      })
      .catch(()=>{window.location.href="/login";});
  },[]);

  if(!ready){
    return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f6f8fc"}}>Loading workspace...</main>;
  }

  return children;
}
