export default function MetricCard({
    label,
    value,
    helper,
    accent = "blue",
  }) {
    const accents = {
      blue: "bg-blue-50 text-blue-700",
      orange: "bg-orange-50 text-orange-700",
      violet: "bg-violet-50 text-violet-700",
      green: "bg-emerald-50 text-emerald-700",
    };
  
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {value}
            </div>
          </div>
          <div className={`h-10 w-10 rounded-xl ${accents[accent] || accents.blue}`} />
        </div>
        {helper && (
          <div className="mt-4 text-xs font-medium text-slate-400">{helper}</div>
        )}
      </div>
    );
  }
  