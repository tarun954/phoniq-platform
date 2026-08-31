import Link from "next/link";
import { requirePlatformPermission } from "@/lib/admin/auth";

export default async function CompaniesPage() {
  const { admin } = await requirePlatformPermission("company.view");

  const { data: companies, error } = await admin
    .from("organizations")
    .select("id,name,created_at")
    .order("created_at",{ascending:false});

  if (error) return <div>Unable to load companies: {error.message}</div>;

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",gap:16}}>
        <div>
          <p style={{color:"#2563eb",fontWeight:900,fontSize:12}}>CUSTOMERS</p>
          <h1 style={{fontSize:38,margin:"6px 0"}}>Companies</h1>
          <p style={{color:"#64748b"}}>Client organizations provisioned on Phoniq.</p>
        </div>
        <Link href="/admin/companies/new" style={{background:"#2563eb",color:"#fff",padding:"12px 16px",height:"fit-content",borderRadius:10,textDecoration:"none",fontWeight:800}}>
          + Add Company
        </Link>
      </div>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden",marginTop:24}}>
        {(companies||[]).map((company)=>(
          <div key={company.id} style={{display:"flex",justifyContent:"space-between",gap:16,padding:18,borderTop:"1px solid #f1f5f9"}}>
            <div>
              <strong>{company.name||"Unnamed company"}</strong>
              <div style={{color:"#94a3b8",fontSize:12}}>{company.id}</div>
            </div>
            <Link href={`/admin/companies/${company.id}`}>Open Company 360</Link>
          </div>
        ))}
      </div>
    </>
  );
}
