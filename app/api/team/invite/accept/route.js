import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const supabase=await createClient();
    const { data:{user}, error:authError }=await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {success:false,error:"Sign in before accepting the invitation."},
        {status:401}
      );
    }

    const body=await request.json();
    const token=String(body?.token||"").trim();
    const admin=createAdminClient();

    const { data: invitation, error }=await admin
      .from("organization_invitations")
      .select("id,organization_id,email,role_id,status,expires_at")
      .eq("token",token)
      .maybeSingle();

    if (error) throw error;
    if (!invitation) return NextResponse.json({success:false,error:"Invitation not found."},{status:404});
    if (invitation.status!=="pending") {
      return NextResponse.json({success:false,error:`Invitation is ${invitation.status}.`},{status:409});
    }

    if (new Date(invitation.expires_at).getTime()<Date.now()) {
      await admin.from("organization_invitations").update({status:"expired"}).eq("id",invitation.id);
      return NextResponse.json({success:false,error:"Invitation expired."},{status:410});
    }

    if (user.email?.toLowerCase()!==invitation.email.toLowerCase()) {
      return NextResponse.json(
        {success:false,error:`Sign in with ${invitation.email}.`},
        {status:403}
      );
    }

    const { data: existing }=await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id",invitation.organization_id)
      .eq("user_id",user.id)
      .maybeSingle();

    if (!existing) {
      const result=await admin
        .from("organization_members")
        .insert({
          organization_id:invitation.organization_id,
          user_id:user.id,
          role_id:invitation.role_id
        });

      if (result.error) throw result.error;
    }

    const accepted=await admin
      .from("organization_invitations")
      .update({
        status:"accepted",
        accepted_by:user.id,
        accepted_at:new Date().toISOString()
      })
      .eq("id",invitation.id);

    if (accepted.error) throw accepted.error;

    return NextResponse.json({success:true});
  } catch (error) {
    console.error("INVITE ACCEPT ERROR:",error);
    return NextResponse.json(
      {success:false,error:error?.message || "Unable to accept invitation."},
      {status:500}
    );
  }
}
