"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export default function NotificationToastHost() {
  const seen =
    useRef(new Set());

  const [toasts, setToasts] =
    useState([]);

  /*
   * --------------------------------------------------
   * Mark one popup as read permanently
   * --------------------------------------------------
   */
  const markRead =
    useCallback(async (id) => {
      if (!id) return;

      try {
        await fetch(
          "/api/client-toast-notifications",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
            }),

            cache: "no-store",
          }
        );
      } catch (error) {
        console.error(
          "Unable to mark toast read:",
          error
        );
      }
    }, []);

  /*
   * --------------------------------------------------
   * Close toast
   * --------------------------------------------------
   */
  const dismissToast =
    useCallback(
      async (id) => {
        setToasts(
          (current) =>
            current.filter(
              (toast) =>
                toast.id !== id
            )
        );

        /*
         * This is mostly a safety call because
         * notifications are already marked read
         * when displayed.
         */
        await markRead(id);
      },
      [markRead]
    );

  /*
   * --------------------------------------------------
   * Poll unread popup notifications
   * --------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const response =
          await fetch(
            "/api/client-toast-notifications",
            {
              cache:
                "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !mounted
        ) {
          return;
        }

        const items =
          result.notifications ||
          [];

        const fresh = [];

        for (
          const item of items
        ) {
          if (
            !item?.id ||
            seen.current.has(
              item.id
            )
          ) {
            continue;
          }

          seen.current.add(
            item.id
          );

          fresh.push(item);
        }

        if (!fresh.length) {
          return;
        }

        /*
         * Display at most 3 new notifications
         * at once.
         */
        const visible =
          fresh.slice(0, 3);

        setToasts(
          (current) => [
            ...visible,
            ...current,
          ].slice(0, 4)
        );

        /*
         * IMPORTANT:
         *
         * Once the notification has been shown
         * to the user, mark it read immediately
         * in Supabase.
         *
         * This prevents it from appearing again
         * after:
         *
         * - page navigation
         * - component remount
         * - browser refresh
         * - logout/login
         */
        await Promise.allSettled(
          visible.map(
            (item) =>
              markRead(item.id)
          )
        );
      } catch (error) {
        console.error(
          "Toast polling error:",
          error
        );
      }
    }

    poll();

    const timer =
      setInterval(
        poll,
        10000
      );

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [markRead]);

  /*
   * --------------------------------------------------
   * Auto-dismiss oldest popup
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timer =
      setTimeout(() => {
        setToasts(
          (current) =>
            current.slice(
              0,
              -1
            )
        );
      }, 6500);

    return () =>
      clearTimeout(timer);
  }, [toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="ph-toast-stack">
      {toasts.map(
        (toast) => (
          <div
            key={toast.id}
            className="ph-toast-card"
          >
            <div className="ph-toast-pulse" />

            <a
              href={
                toast.href ||
                "#"
              }
              className="ph-toast-content"
              onClick={() => {
                /*
                 * Already marked read when shown,
                 * but keeping this makes navigation
                 * behavior extra safe.
                 */
                void markRead(
                  toast.id
                );
              }}
            >
              <strong>
                {toast.title ||
                  "New notification"}
              </strong>

              <p>
                {toast.message ||
                  ""}
              </p>
            </a>

            <button
              type="button"
              className="ph-toast-close"
              aria-label="Close notification"
              title="Close"
              onClick={(
                event
              ) => {
                event.preventDefault();
                event.stopPropagation();

                void dismissToast(
                  toast.id
                );
              }}
            >
              ×
            </button>
          </div>
        )
      )}

      <style jsx global>{`
        .ph-toast-stack {
          position: fixed;
          right: 24px;
          top: 94px;
          z-index: 15000;
          display: grid;
          gap: 10px;
          width: min(
            390px,
            calc(100vw - 40px)
          );
        }

        .ph-toast-card {
          position: relative;
          display: grid;
          grid-template-columns:
            12px
            minmax(0, 1fr)
            32px;
          gap: 12px;
          align-items: flex-start;

          background: #ffffff;

          border:
            1px solid #dbe4ef;

          border-radius: 14px;

          padding:
            15px
            12px
            15px
            15px;

          color: #0f172a;

          box-shadow:
            0 18px 55px
            rgba(
              15,
              23,
              42,
              0.18
            );

          animation:
            phToastIn
            0.36s
            ease-out;
        }

        .ph-toast-content {
          display: block;
          min-width: 0;

          text-decoration:
            none;

          color:
            #0f172a;
        }

        .ph-toast-content strong {
          display: block;

          font-size:
            15px;

          font-weight:
            700;

          padding-right:
            4px;
        }

        .ph-toast-content p {
          margin:
            4px
            0
            0;

          color:
            #64748b;

          line-height:
            1.4;

          font-size:
            14px;
        }

        .ph-toast-content:hover strong {
          color:
            #2563eb;
        }

        .ph-toast-pulse {
          width: 10px;
          height: 10px;

          border-radius:
            999px;

          background:
            #2563eb;

          margin-top:
            4px;

          box-shadow:
            0
            0
            0
            0
            rgba(
              37,
              99,
              235,
              0.45
            );

          animation:
            phPulse
            1.35s
            infinite;
        }

        .ph-toast-close {
          width: 30px;
          height: 30px;

          border: 0;

          border-radius:
            8px;

          background:
            transparent;

          color:
            #64748b;

          font-size:
            22px;

          line-height:
            1;

          cursor:
            pointer;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          transition:
            background
            0.15s ease,
            color
            0.15s ease;
        }

        .ph-toast-close:hover {
          background:
            #f1f5f9;

          color:
            #0f172a;
        }

        @keyframes phToastIn {
          from {
            opacity: 0;

            transform:
              translateX(28px)
              scale(0.98);
          }

          to {
            opacity: 1;

            transform:
              translateX(0)
              scale(1);
          }
        }

        @keyframes phPulse {
          0% {
            box-shadow:
              0
              0
              0
              0
              rgba(
                37,
                99,
                235,
                0.45
              );
          }

          70% {
            box-shadow:
              0
              0
              0
              10px
              rgba(
                37,
                99,
                235,
                0
              );
          }

          100% {
            box-shadow:
              0
              0
              0
              0
              rgba(
                37,
                99,
                235,
                0
              );
          }
        }

        @media (
          max-width: 640px
        ) {
          .ph-toast-stack {
            right: 12px;
            top: 78px;

            width:
              calc(
                100vw -
                24px
              );
          }
        }
      `}</style>
    </div>
  );
}