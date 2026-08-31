import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request,{params}) {
  try {
    const {token}=await params;
    const admin=createAdminClient();
    const {data:invitation,error}=await admin
      .from("organization_invitations")
      .select(`id,email,status,expires_at,organizations(name),organization_roles(name,role_key)`)
      .eq("token",token).maybeSingle();
    if(error) throw error;
    if(!invitation) return NextResponse.json({success:false,error:"Invitation not found."},{status:404});
    if(invitation.expires_at && new Date(invitation.expires_at).getTime()<Date.now())
      return NextResponse.json({success:false,error:"Invitation expired."},{status:410});
    return NextResponse.json({success:true,invitation:{
      email:invitation.email,status:invitation.status,expiresAt:invitation.expires_at,
      companyName:invitation.organizations?.name||"your company",
      roleName:invitation.organization_roles?.name||"Team Member"
    }});
  } catch(error) {
    return NextResponse.json({success:false,error:error?.message||"Unable to load invitation."},{status:500});
  }
}
