import Link from "next/link";
import { requirePlatformPermission } from "@/lib/admin/auth";

export default async function Company360Page({params}){
  const {id}=await params;
  const {admin}=await requirePlatformPermission("company.view");

  const {data:company,error}=await admin.from("organizations")
    .select("id,name,created_at").eq("id",id).maybeSingle();

  if(error||!company)return <div>Company not found.</div>;

  const [members,leads,calls,appointments,phones]=await Promise.all([
    admin.from("organization_members").select("id",{count:"exact",head:true}).eq("organization_id",id),
    admin.from("leads").select("id",{count:"exact",head:true}).eq("organization_id",id),
    admin.from("calls").select("id",{count:"exact",head:true}).eq("organization_id",id),
    admin.from("appointments").select("id",{count:"exact",head:true}).eq("organization_id",id),
    admin.from("phone_numbers").select("*").eq("organization_id",id),
  ]);

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"flex-start"}}>
        <div>
          <p style={{color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.5,margin:0}}>COMPANY 360</p>
          <h1 style={{fontSize:40,margin:"7px 0"}}>{company.name}</h1>
          <p style={{color:"#64748b"}}>{company.id}</p>
        </div>

        <Link href={`/admin/companies/${id}/access`} style={{
          background:"#2563eb",color:"#fff",textDecoration:"none",
          borderRadius:10,padding:"12px 16px",fontWeight:850
        }}>
          Manage Client Permissions
        </Link>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:24}}>
        {[
          ["Members",members.count||0],["Leads",leads.count||0],
          ["Calls",calls.count||0],["Appointments",appointments.count||0]
        ].map(([label,value])=>(
          <div key={label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
            <div style={{color:"#64748b"}}>{label}</div>
            <div style={{fontSize:30,fontWeight:900}}>{value}</div>
          </div>
        ))}
      </div>

      <section style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:22,marginTop:22}}>
        <h2>Phone Numbers</h2>
        {(phones.data||[]).length ? (phones.data||[]).map(number=>(
          <div key={number.id||number.phone_number} style={{padding:"10px 0",borderTop:"1px solid #f1f5f9"}}>
            {number.phone_number||number.number||"Phone number"}
          </div>
        )):<p style={{color:"#64748b"}}>No number assigned yet.</p>}
      </section>
    </>
  );
}
