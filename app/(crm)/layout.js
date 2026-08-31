import Sidebar from "@/components/crm/Sidebar";

export default function CRMLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar />

      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>

    </div>
  );
}