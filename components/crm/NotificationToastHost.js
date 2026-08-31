"use client";

import { useEffect, useRef, useState } from "react";

export default function NotificationToastHost() {
  const seen = useRef(new Set());
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const response = await fetch("/api/client-toast-notifications", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !mounted) return;

        const items = result.notifications || [];
        const fresh = [];

        for (const item of items) {
          if (!seen.current.has(item.id)) {
            seen.current.add(item.id);
            if (!item.read) fresh.push(item);
          }
        }

        if (fresh.length) {
          setToasts((current) => [...fresh.slice(0, 3), ...current].slice(0, 4));
        }
      } catch {}
    }

    poll();
    const timer = setInterval(poll, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => {
      setToasts((current) => current.slice(0, -1));
    }, 6500);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="ph-toast-stack">
      {toasts.map((toast) => (
        <a key={toast.id} href={toast.href || "#"} className="ph-toast-card">
          <div className="ph-toast-pulse" />
          <div>
            <strong>{toast.title || "New notification"}</strong>
            <p>{toast.message || ""}</p>
          </div>
        </a>
      ))}

      <style jsx global>{`
        .ph-toast-stack{position:fixed;right:24px;top:94px;z-index:15000;display:grid;gap:10px;width:min(390px,calc(100vw - 40px))}
        .ph-toast-card{display:grid;grid-template-columns:12px 1fr;gap:12px;align-items:flex-start;background:#fff;border:1px solid #dbe4ef;border-radius:14px;padding:15px;text-decoration:none;color:#0f172a;box-shadow:0 18px 55px rgba(15,23,42,.18);animation:phToastIn .36s ease-out}
        .ph-toast-card p{margin:4px 0 0;color:#64748b;line-height:1.4}
        .ph-toast-pulse{width:10px;height:10px;border-radius:999px;background:#2563eb;margin-top:4px;box-shadow:0 0 0 0 rgba(37,99,235,.45);animation:phPulse 1.35s infinite}
        @keyframes phToastIn{from{opacity:0;transform:translateX(28px) scale(.98)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes phPulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,.45)}70%{box-shadow:0 0 0 10px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
      `}</style>
    </div>
  );
}
