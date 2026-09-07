"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatAge(value) {
  if (!value) return "";

  const created = new Date(value).getTime();

  if (!Number.isFinite(created)) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - created) / 1000)
  );

  if (seconds < 60) return "now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  return `${days}d`;
}

export default function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async ({ sync = false } = {}) => {
    try {
      setError("");

      if (sync) {
        await fetch("/api/notifications/sync", {
          method: "POST",
          cache: "no-store",
        }).catch(() => null);
      }

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error || "Unable to load notifications."
        );
      }

      setNotifications(
        Array.isArray(result.notifications)
          ? result.notifications
          : []
      );

      setUnreadCount(Number(result.unreadCount) || 0);
    } catch (loadError) {
      setError(
        loadError?.message || "Unable to load notifications."
      );
    }
  }, []);

  useEffect(() => {
    loadNotifications({ sync: true });

    const interval = window.setInterval(() => {
      loadNotifications();
    }, 45000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function toggleNotifications() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      setLoading(true);
      await loadNotifications({ sync: true });
      setLoading(false);
    }
  }

  async function markAllRead(event) {
    event.preventDefault();
    event.stopPropagation();

    if (markingAll || unreadCount === 0) return;

    const previous = notifications;
    const previousUnreadCount = unreadCount;
    const now = new Date().toISOString();

    setMarkingAll(true);
    setError("");

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at || now,
      }))
    );

    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error || "Unable to mark notifications as read."
        );
      }

      await loadNotifications();
    } catch (markError) {
      setNotifications(previous);
      setUnreadCount(previousUnreadCount);
      setError(
        markError?.message ||
          "Unable to mark notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(item) {
    setOpen(false);

    if (!item.read_at) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );

      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
          }),
        });
      } catch {
        // Do not block navigation if the read update fails.
      }
    }

    if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative z-[700] shrink-0 overflow-visible"
    >
      <button
        type="button"
        onClick={toggleNotifications}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[72px] z-[9999] max-h-[min(70vh,520px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[52px] sm:w-[405px]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <div>
              <h3 className="m-0 text-sm font-extrabold text-slate-900">
                Notifications
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || unreadCount === 0}
              className="rounded-lg px-2 py-1 text-xs font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-default disabled:text-slate-400"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="max-h-[min(58vh,430px)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-9 text-center">
                <div className="text-sm font-semibold text-slate-700">
                  No notifications
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  New lead and customer activity will appear here.
                </div>
              </div>
            ) : (
              notifications.map((item) => {
                const unread = !item.read_at;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50 ${
                      unread ? "bg-blue-50/40" : "bg-white"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        unread
                          ? item.type === "critical"
                            ? "bg-red-500"
                            : "bg-amber-500"
                          : "bg-slate-300"
                      }`}
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-bold text-slate-900">
                          {item.title || "Notification"}
                        </span>

                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatAge(item.created_at)}
                        </span>
                      </span>

                      {item.message && (
                        <span className="mt-1 block break-words text-xs leading-5 text-slate-500">
                          {item.message}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
