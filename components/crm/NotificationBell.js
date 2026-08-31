"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function timeAgo(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef(null);

  async function load() {
    try {
      await fetch("/api/notifications/sync", { method: "POST" });

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });
      const result = await response.json();

      if (response.ok) {
        setItems(result.notifications || []);
        setUnread(result.unreadCount || 0);
      }
    } catch (error) {
      console.error("Notification load error:", error);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(item) {
    if (!item.read_at) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
    }
    setOpen(false);
    load();
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  return (
    <div ref={rootRef} className="notification-root">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="notification-count">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-header">
            <div>
              <strong>Notifications</strong>
              <span>{unread} unread</span>
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {items.length === 0 ? (
              <div className="notification-empty">
                No notifications yet.
              </div>
            ) : (
              items.map((item) => (
                <Link
                  href={item.href || "#"}
                  key={item.id}
                  onClick={() => markRead(item)}
                  className={`notification-item ${
                    item.read_at ? "" : "is-unread"
                  }`}
                >
                  <div className={`notification-dot notification-${item.type || "info"}`} />
                  <div className="notification-copy">
                    <div className="notification-title">{item.title}</div>
                    <div className="notification-message">{item.message}</div>
                  </div>
                  <div className="notification-time">{timeAgo(item.created_at)}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
