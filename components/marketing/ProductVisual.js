export default function ProductVisual() {
    return (
      <div className="phoniq-perspective relative mx-auto w-full max-w-[620px] py-8">
        <div className="phoniq-3d rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,.12)]">
          <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-[#f7f9fc]">
            <div className="flex h-12 items-center border-b border-slate-200 bg-white px-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="mx-auto text-[10px] font-extrabold tracking-[.12em] text-slate-400">
                PHONIQ CRM
              </div>
            </div>
  
            <div className="grid min-h-[390px] grid-cols-[110px_1fr]">
              <div className="border-r border-slate-200 bg-white p-3">
                <div className="mb-5 h-8 rounded-xl bg-blue-600" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`mb-2 h-7 rounded-lg ${
                      i === 2 ? "bg-blue-50" : "bg-slate-50"
                    }`}
                  />
                ))}
              </div>
  
              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="h-3 w-24 rounded bg-slate-300" />
                    <div className="mt-3 h-7 w-40 rounded bg-slate-900" />
                  </div>
                  <div className="h-9 w-24 rounded-xl bg-blue-600" />
                </div>
  
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {["bg-white", "bg-orange-50", "bg-emerald-50"].map((style, i) => (
                    <div key={i} className={`rounded-2xl border border-slate-200 ${style} p-4`}>
                      <div className="h-2.5 w-14 rounded bg-slate-300" />
                      <div className="mt-3 h-7 w-10 rounded bg-slate-800" />
                    </div>
                  ))}
                </div>
  
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[36px_1fr_80px] items-center gap-3 border-b border-slate-100 p-3 last:border-b-0"
                    >
                      <div className="h-8 w-8 rounded-xl bg-blue-50" />
                      <div>
                        <div className="h-2.5 w-24 rounded bg-slate-300" />
                        <div className="mt-2 h-2 w-32 rounded bg-slate-100" />
                      </div>
                      <div className={`h-6 rounded-full ${i === 1 ? "bg-orange-100" : "bg-blue-50"}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div className="phoniq-float absolute -bottom-2 right-3 hidden w-[150px] rounded-[28px] border-[6px] border-slate-900 bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,.18)] sm:block">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-900" />
          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <div className="text-[8px] font-bold opacity-80">AI ASSISTANT</div>
            <div className="mt-2 text-xs font-extrabold">New lead captured</div>
            <div className="mt-2 rounded-xl bg-white/15 p-2 text-[8px]">
              AC not cooling • Hot lead
            </div>
          </div>
        </div>
      </div>
    );
  }
  