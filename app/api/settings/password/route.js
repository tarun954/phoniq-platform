import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({success:false,error:"Sign in required."},{status:401});

    const admin = createAdminClient();
    const { data: member } = await admin
      .from("organization_members")
      .select("role,role_id")
      .eq("user_id",user.id)
      .maybeSingle();

    let roleKey = String(member?.role||"").toLowerCase();

    if (member?.role_id) {
      const { data: role } = await admin
        .from("organization_roles")
        .select("role_key")
        .eq("id",member.role_id)
        .maybeSingle();
      roleKey = String(role?.role_key||roleKey).toLowerCase();
    }

    if (!["owner","admin"].includes(roleKey)) {
      return NextResponse.json(
        {success:false,error:"Your role has read-only settings access."},
        {status:403}
      );
    }

    const body=await request.json();
    const password=String(body?.password||"");

    if(password.length<8){
      return NextResponse.json({success:false,error:"Password must be at least 8 characters."},{status:400});
    }

    const { error } = await supabase.auth.updateUser({password});
    if(error) throw error;

    return NextResponse.json({success:true});
  } catch(error) {
    return NextResponse.json({success:false,error:error?.message||"Unable to update password."},{status:500});
  }
}
