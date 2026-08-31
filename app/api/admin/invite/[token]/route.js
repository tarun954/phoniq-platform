import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request,{params}){
  try{
    const {token}=await params;
    const admin=createAdminClient();
    const {data,error}=await admin.from("platform_invitations")
      .select("email,display_role,status,expires_at")
      .eq("token",token).maybeSingle();
    if(error)throw error;
    if(!data)return NextResponse.json({success:false,error:"Invitation not found."},{status:404});
    return NextResponse.json({
      success:true,
      invitation:{email:data.email,displayRole:data.display_role,status:data.status,expiresAt:data.expires_at}
    });
  }catch(error){
    return NextResponse.json({success:false,error:error?.message||"Unable to load invitation."},{status:500});
  }
}
