import { NextResponse } from "next/server";
import { requirePermission, permissionErrorResponse } from "@/lib/crm/permissions";

export const runtime="nodejs";

export async function GET() {
  try {
    const { admin, organizationId, user, authorization } =
      await requirePermission("team.view");

    const { data: members, error } = await admin
      .from("organization_members")
      .select(`
        id,user_id,organization_id,role,role_id,created_at,
        organization_roles(id,role_key,name,description,is_system)
      `)
      .eq("organization_id",organizationId)
      .order("created_at");

    if (error) throw error;

    const userIds=(members||[]).map(x=>x.user_id).filter(Boolean);
    let profiles=[];

    if (userIds.length) {
      const result=await admin
        .from("profiles")
        .select("id,full_name,email,phone,avatar_url")
        .in("id",userIds);

      if (!result.error) profiles=result.data||[];
    }

    const profileMap=new Map(profiles.map(p=>[p.id,p]));

    const enriched=(members||[]).map(member=>({
      ...member,
      is_current_user:member.user_id===user.id,
      profile:profileMap.get(member.user_id)||{id:member.user_id},
      resolved_role:member.organization_roles || {
        role_key:String(member.role||"viewer").toLowerCase(),
        name:String(member.role||"Viewer")
      }
    }));

    const { data: roles, error: roleError } = await admin
      .from("organization_roles")
      .select("id,role_key,name,description,is_system")
      .eq("organization_id",organizationId)
      .order("is_system",{ascending:false})
      .order("name");

    if (roleError) throw roleError;

    const { data: invitations, error: inviteError } = await admin
      .from("organization_invitations")
      .select(`
        id,email,status,expires_at,created_at,role_id,
        organization_roles(id,role_key,name)
      `)
      .eq("organization_id",organizationId)
      .order("created_at",{ascending:false});

    if (inviteError) throw inviteError;

    return NextResponse.json({
      success:true,
      members:enriched,
      roles:roles||[],
      invitations:invitations||[],
      myPermissions:authorization.permissions,
      myRole:authorization.role
    });
  } catch (error) {
    return permissionErrorResponse(error);
  }
}
