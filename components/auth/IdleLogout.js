"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function IdleLogout({ timeoutMinutes = 10, warningSeconds = 60 }) {
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const intervalRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = Math.max(0, timeoutMs - warningSeconds * 1000);

    async function logout() {
      await supabase.auth.signOut();
      window.location.href = "/login?reason=inactive";
    }

    function clearAll() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    function startWarning() {
      let remaining = warningSeconds;
      setSecondsLeft(remaining);
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining <= 0) clearInterval(intervalRef.current);
      }, 1000);
    }

    function reset() {
      clearAll();
      setSecondsLeft(null);
      warningTimerRef.current = setTimeout(startWarning, warningMs);
      timerRef.current = setTimeout(logout, timeoutMs);
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, reset, { passive: true }));
    reset();

    return () => {
      clearAll();
      events.forEach((name) => window.removeEventListener(name, reset));
    };
  }, [timeoutMinutes, warningSeconds]);

  if (secondsLeft === null || secondsLeft <= 0) return null;

  return (
    <div style={{ position:"fixed", right:20, bottom:20, zIndex:20000 }}>
      <div style={{
        maxWidth:380, background:"#fff", border:"1px solid #f59e0b",
        borderRadius:12, padding:16, boxShadow:"0 18px 50px rgba(15,23,42,.16)"
      }}>
        <strong>Session expiring soon</strong>
        <p style={{ margin:"7px 0 0", color:"#64748b" }}>
          You will be signed out in {secondsLeft} seconds because of inactivity.
          Move the mouse or press a key to continue.
        </p>
      </div>
    </div>
  );
}
