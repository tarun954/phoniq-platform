const styles = {
    new: "bg-blue-50 text-blue-700 ring-blue-100",
    qualified: "bg-violet-50 text-violet-700 ring-violet-100",
    assigned: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    contacting: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    follow_up: "bg-amber-50 text-amber-700 ring-amber-100",
    appointment_requested: "bg-sky-50 text-sky-700 ring-sky-100",
    scheduled: "bg-purple-50 text-purple-700 ring-purple-100",
    in_progress: "bg-orange-50 text-orange-700 ring-orange-100",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    resolved: "bg-green-50 text-green-700 ring-green-100",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
    lost: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  
  export default function StatusBadge({ status = "new" }) {
    const label = status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
          styles[status] || styles.new
        }`}
      >
        {label}
      </span>
    );
  }
  