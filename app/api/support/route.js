import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){const e=new Error("Sign in required.");e.status=401;throw e;}

  const admin=createAdminClient();
  const {data:member,error}=await admin.from("organization_members")
    .select("organization_id").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  if(!member){const e=new Error("No organization membership found.");e.status=403;throw e;}

  return {admin,user,organizationId:member.organization_id};
}

export async function GET(){
  try{
    const {admin,organizationId}=await getContext();
    const {data,error}=await admin.from("support_tickets").select("*")
      .eq("organization_id",organizationId).order("created_at",{ascending:false});
    if(error)throw error;
    return NextResponse.json({success:true,tickets:data||[]});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load tickets."},{status});
  }
}

export async function POST(request){
  try{
    const {admin,user,organizationId}=await getContext();
    const body=await request.json();
    const subject=String(body?.subject||"").trim();
    const description=String(body?.description||"").trim();
    const priority=["low","normal","high","urgent"].includes(body?.priority)?body.priority:"normal";

    if(!subject||!description){
      return NextResponse.json({success:false,error:"Subject and description are required."},{status:400});
    }

    const {data:ticket,error}=await admin.from("support_tickets").insert({
      organization_id:organizationId,created_by:user.id,subject,description,priority
    }).select("*").single();

    if(error)throw error;

    // Notify Phoniq support/admin users about a new ticket.
    const {data:platformUsers}=await admin.from("platform_users")
      .select("user_id,role,active").eq("active",true)
      .in("role",["super_admin","platform_admin","support"]);

    if(platformUsers?.length){
      await admin.from("platform_notifications").insert(
        platformUsers.map(p=>({
          user_id:p.user_id,
          type:"support.ticket.created",
          title:"New support ticket",
          message:`${subject} · ${priority} priority`,
          href:"/admin/support",
          metadata:{ticket_id:ticket.id,organization_id:organizationId}
        }))
      );
    }

    return NextResponse.json({success:true,ticket},{status:201});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to create ticket."},{status});
  }
}
