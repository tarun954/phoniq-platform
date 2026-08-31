import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();

  if(!user)return NextResponse.json({success:false,error:"Sign in required."},{status:401});

  const admin=createAdminClient();
  const {data,error}=await admin.from("platform_users")
    .select("user_id,role,active").eq("user_id",user.id).maybeSingle();

  if(error)throw error;

  if(!data||!data.active){
    return NextResponse.json({success:false,error:"This account is not authorized for the Phoniq Admin Console."},{status:403});
  }

  return NextResponse.json({success:true,platformUser:data});
}
