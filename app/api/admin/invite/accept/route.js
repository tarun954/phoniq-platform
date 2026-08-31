import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request){
  try{
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({success:false,error:"Sign in required."},{status:401});

    const {token}=await request.json();
    const admin=createAdminClient();
    const {data:invite,error}=await admin.from("platform_invitations").select("*").eq("token",token).maybeSingle();
    if(error)throw error;
    if(!invite)return NextResponse.json({success:false,error:"Invitation not found."},{status:404});
    if(invite.status!=="pending")return NextResponse.json({success:false,error:`Invitation is ${invite.status}.`},{status:409});

    if(String(user.email||"").toLowerCase()!==String(invite.email).toLowerCase()){
      return NextResponse.json({success:false,error:`Sign in with ${invite.email}.`},{status:403});
    }

    const {error:userError}=await admin.from("platform_users").upsert({
      user_id:user.id,role:invite.platform_role,active:true,updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(userError)throw userError;

    if(Array.isArray(invite.permission_keys)&&invite.permission_keys.length){
      const {data:permissions,error:permissionError}=await admin.from("platform_permissions")
        .select("id,permission_key").in("permission_key",invite.permission_keys);
      if(permissionError)throw permissionError;

      const rows=(permissions||[]).map(permission=>({
        user_id:user.id,permission_id:permission.id,allowed:true,
        updated_by:invite.invited_by,updated_at:new Date().toISOString()
      }));

      if(rows.length){
        const {error:overrideError}=await admin.from("platform_user_permission_overrides")
          .upsert(rows,{onConflict:"user_id,permission_id"});
        if(overrideError)throw overrideError;
      }
    }

    const {error:acceptError}=await admin.from("platform_invitations").update({
      status:"accepted",accepted_by:user.id,accepted_at:new Date().toISOString()
    }).eq("id",invite.id);
    if(acceptError)throw acceptError;

    return NextResponse.json({success:true});
  }catch(error){
    return NextResponse.json({success:false,error:error?.message||"Unable to accept invitation."},{status:500});
  }
}
