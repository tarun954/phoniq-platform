"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setLeads([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/leads", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok) {
          setLeads(result.leads || []);
        }
      } catch {}
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (value.length < 2) return [];

    return leads
      .filter((lead) =>
        [
          lead.customer?.full_name,
          lead.customer?.phone,
          lead.customer?.city,
          lead.service_issue,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(value)
          )
      )
      .slice(0, 7);
  }, [leads, query]);

  return (
    <div className="relative w-full">
      {/* <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        ⌕
      </div> */}

      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        className="phoniq-input !min-h-[44px] !rounded-[14px] !bg-slate-50 pl-11 pr-4"
        placeholder="Search leads, customers, phone numbers or service issues..."
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[52px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {results.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">
              No matching CRM records.
            </div>
          ) : (
            results.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
              >
                <div className="text-sm font-extrabold text-slate-900">
                  {lead.customer?.full_name || "Customer"}
                </div>

                <div className="mt-1 truncate text-xs text-slate-500">
                  {lead.service_issue} • {lead.customer?.phone || ""}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
