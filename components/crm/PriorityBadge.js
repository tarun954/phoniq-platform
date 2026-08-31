const styles = {
    critical: "bg-red-50 text-red-700 ring-red-100",
    hot: "bg-orange-50 text-orange-700 ring-orange-100",
    normal: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  
  export default function PriorityBadge({ priority = "normal" }) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
          styles[priority] || styles.normal
        }`}
      >
        {priority === "critical" && <span>●</span>}
        {priority === "hot" && <span>🔥</span>}
        {priority === "critical"
          ? "Critical"
          : priority === "hot"
            ? "Hot"
            : "Normal"}
      </span>
    );
  }
  