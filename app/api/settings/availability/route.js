import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function ctx(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){const e=new Error("Sign in required.");e.status=401;throw e;}

  const admin=createAdminClient();
  const {data:member,error}=await admin.from("organization_members")
    .select("organization_id,role,role_id").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  if(!member){const e=new Error("No organization membership found.");e.status=403;throw e;}

  let roleKey=String(member.role||"").toLowerCase();
  if(member.role_id){
    const {data:role}=await admin.from("organization_roles")
      .select("role_key").eq("id",member.role_id).maybeSingle();
    roleKey=String(role?.role_key||roleKey).toLowerCase();
  }

  return {admin,organizationId:member.organization_id,canEdit:["owner","admin"].includes(roleKey)};
}

export async function GET(){
  try{
    const {admin,organizationId,canEdit}=await ctx();
    const {data,error}=await admin.from("company_availability")
      .select("*").eq("organization_id",organizationId).order("weekday");
    if(error)throw error;

    return NextResponse.json({success:true,canEdit,availability:data||[]});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load availability."},{status});
  }
}

export async function PUT(request){
  try{
    const {admin,organizationId,canEdit}=await ctx();

    if(!canEdit)return NextResponse.json({success:false,error:"Only Owner/Admin can edit availability."},{status:403});

    const body=await request.json();
    const days=Array.isArray(body?.days)?body.days:[];

    for(const day of days){
      const weekday=Number(day.weekday);
      if(weekday<0||weekday>6)continue;

      const {error}=await admin.from("company_availability").upsert({
        organization_id:organizationId,
        weekday,
        enabled:Boolean(day.enabled),
        start_time:day.startTime||"09:00",
        end_time:day.endTime||"17:00",
        slot_minutes:Number(day.slotMinutes)||60,
        updated_at:new Date().toISOString()
      },{onConflict:"organization_id,weekday"});

      if(error)throw error;
    }

    return NextResponse.json({success:true});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to save availability."},{status});
  }
}
