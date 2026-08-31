import { NextResponse } from "next/server";
import { requirePermission, permissionErrorResponse } from "@/lib/crm/permissions";

export async function DELETE(request,{params}) {
  try {
    const { admin, organizationId }=await requirePermission("role.manage");
    const { id }=await params;

    const { data: role, error }=await admin
      .from("organization_roles")
      .select("id,name,is_system")
      .eq("id",id)
      .eq("organization_id",organizationId)
      .maybeSingle();

    if (error) throw error;
    if (!role) return NextResponse.json({success:false,error:"Role not found."},{status:404});
    if (role.is_system) return NextResponse.json({success:false,error:"System roles cannot be deleted."},{status:400});

    const { count, error:cError }=await admin
      .from("organization_members")
      .select("id",{count:"exact",head:true})
      .eq("organization_id",organizationId)
      .eq("role_id",id);

    if (cError) throw cError;
    if ((count||0)>0) {
      return NextResponse.json(
        {success:false,error:"Move members to another role before deleting this role."},
        {status:409}
      );
    }

    const result=await admin
      .from("organization_roles")
      .delete()
      .eq("id",id)
      .eq("organization_id",organizationId);

    if (result.error) throw result.error;

    return NextResponse.json({success:true});
  } catch (error) {
    return permissionErrorResponse(error);
  }
}
