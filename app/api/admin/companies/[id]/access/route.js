import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

export async function GET(_request,{params}){
  try{
    const {id}=await params;
    const {admin}=await requirePlatformPermission("company.support_access");

    const [{data:company,error:companyError},{data:roles,error:roleError},{data:members,error:memberError},{data:permissions,error:permissionError}] = await Promise.all([
      admin.from("organizations").select("id,name").eq("id",id).maybeSingle(),
      admin.from("organization_roles").select("*").eq("organization_id",id).order("name"),
      admin.from("organization_members").select("id,user_id,role,role_id,created_at").eq("organization_id",id).order("created_at"),
      admin.from("organization_permissions").select("id,permission_key,name,description,category").order("category").order("permission_key")
    ]);

    if(companyError)throw companyError;
    if(roleError)throw roleError;
    if(memberError)throw memberError;
    if(permissionError)throw permissionError;
    if(!company)return NextResponse.json({success:false,error:"Company not found."},{status:404});

    const roleIds=(roles||[]).map(r=>r.id);
    let rolePermissionRows=[];

    if(roleIds.length){
      const result=await admin.from("organization_role_permissions")
        .select("role_id,permission_id").in("role_id",roleIds);
      if(result.error)throw result.error;
      rolePermissionRows=result.data||[];
    }

    return NextResponse.json({
      success:true,
      company,
      roles:roles||[],
      members:members||[],
      permissions:permissions||[],
      rolePermissions:rolePermissionRows
    });
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load company access."},{status});
  }
}

export async function PATCH(request,{params}){
  try{
    const {id}=await params;
    const {admin}=await requirePlatformPermission("company.update");
    const body=await request.json();

    const roleId=String(body?.roleId||"");
    const permissionIds=Array.isArray(body?.permissionIds)?body.permissionIds:[];

    const {data:role,error:roleError}=await admin.from("organization_roles")
      .select("id,organization_id,role_key").eq("id",roleId).eq("organization_id",id).maybeSingle();

    if(roleError)throw roleError;
    if(!role)return NextResponse.json({success:false,error:"Role not found in this company."},{status:404});

    if(String(role.role_key||"").toLowerCase()==="owner"){
      return NextResponse.json({success:false,error:"Client Owner keeps full workspace access."},{status:400});
    }

    const {error:deleteError}=await admin.from("organization_role_permissions").delete().eq("role_id",roleId);
    if(deleteError)throw deleteError;

    if(permissionIds.length){
      const {error:insertError}=await admin.from("organization_role_permissions").insert(
        permissionIds.map(permissionId=>({role_id:roleId,permission_id:permissionId}))
      );
      if(insertError)throw insertError;
    }

    return NextResponse.json({success:true});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to update company role."},{status});
  }
}
