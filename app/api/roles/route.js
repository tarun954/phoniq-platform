import { NextResponse } from "next/server";
import { requirePermission, permissionErrorResponse } from "@/lib/crm/permissions";

function roleKey(value="") {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60);
}

export async function GET() {
  try {
    const { admin, organizationId }=await requirePermission("role.view");

    const { data: roles, error }=await admin
      .from("organization_roles")
      .select("id,role_key,name,description,is_system,created_at")
      .eq("organization_id",organizationId)
      .order("is_system",{ascending:false})
      .order("name");

    if (error) throw error;

    const { data: permissions, error:pError }=await admin
      .from("organization_permissions")
      .select("id,permission_key,name,description,category")
      .order("category")
      .order("name");

    if (pError) throw pError;

    const roleIds=(roles||[]).map(x=>x.id);
    let rows=[];

    if (roleIds.length) {
      const result=await admin
        .from("organization_role_permissions")
        .select(`role_id,organization_permissions(id,permission_key,name,description,category)`)
        .in("role_id",roleIds);

      if (result.error) throw result.error;
      rows=result.data||[];
    }

    const map=new Map();
    for (const row of rows) {
      if (!map.has(row.role_id)) map.set(row.role_id,[]);
      if (row.organization_permissions) map.get(row.role_id).push(row.organization_permissions);
    }

    return NextResponse.json({
      success:true,
      roles:(roles||[]).map(r=>({...r,permissions:map.get(r.id)||[]})),
      permissions:permissions||[]
    });
  } catch (error) {
    return permissionErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { admin, organizationId }=await requirePermission("role.manage");
    const body=await request.json();
    const name=String(body?.name||"").trim();
    const keys=Array.isArray(body?.permissions)?body.permissions.filter(Boolean):[];

    if (!name) return NextResponse.json({success:false,error:"Role name is required."},{status:400});

    const { data: role, error }=await admin
      .from("organization_roles")
      .insert({
        organization_id:organizationId,
        role_key:roleKey(name),
        name,
        description:String(body?.description||"").trim()||null,
        is_system:false
      })
      .select("*")
      .single();

    if (error) throw error;

    if (keys.length) {
      const result=await admin
        .from("organization_permissions")
        .select("id,permission_key")
        .in("permission_key",keys);

      if (result.error) throw result.error;

      const inserts=(result.data||[]).map(p=>({role_id:role.id,permission_id:p.id}));
      if (inserts.length) {
        const insertResult=await admin.from("organization_role_permissions").insert(inserts);
        if (insertResult.error) throw insertResult.error;
      }
    }

    return NextResponse.json({success:true,role},{status:201});
  } catch (error) {
    return permissionErrorResponse(error);
  }
}
