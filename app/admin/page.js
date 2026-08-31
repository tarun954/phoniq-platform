import Link from "next/link";
import { requirePlatformPermission } from "@/lib/admin/auth";

export default async function AdminOverviewPage() {
  const { admin } = await requirePlatformPermission("platform.overview.view");

  const [organizations, members, leads, calls] = await Promise.all([
    admin.from("organizations").select("id",{count:"exact",head:true}),
    admin.from("organization_members").select("id",{count:"exact",head:true}),
    admin.from("leads").select("id",{count:"exact",head:true}),
    admin.from("calls").select("id",{count:"exact",head:true}),
  ]);

  return (
    <>
      <p style={{color:"#2563eb",fontWeight:900,fontSize:12}}>PHONIQ CONTROL PLANE</p>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}>
        <div>
          <h1 style={{fontSize:40,margin:"6px 0"}}>Platform Overview</h1>
          <p style={{color:"#64748b"}}>Manage every client organization from one internal console.</p>
        </div>
        <Link href="/admin/companies/new" style={{background:"#2563eb",color:"#fff",padding:"12px 16px",borderRadius:10,textDecoration:"none",fontWeight:800}}>
          + Onboard Company
        </Link>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginTop:28}}>
        {[
          ["Companies",organizations.count||0],
          ["Client Users",members.count||0],
          ["Leads",leads.count||0],
          ["Calls",calls.count||0],
        ].map(([label,value])=>(
          <div key={label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:22}}>
            <div style={{color:"#64748b"}}>{label}</div>
            <div style={{fontSize:34,fontWeight:900,marginTop:8}}>{value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
