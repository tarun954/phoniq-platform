import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

export async function GET(){
  try{
    const {admin}=await requirePlatformPermission("support.view");

    const {data:tickets,error}=await admin.from("support_tickets")
      .select("*,organizations(id,name)")
      .order("created_at",{ascending:false});
    if(error)throw error;

    const {data:platformUsers}=await admin.from("platform_users")
      .select("user_id,role,active").eq("active",true);

    return NextResponse.json({success:true,tickets:tickets||[],assignees:platformUsers||[]});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load support."},{status});
  }
}

export async function PATCH(request){
  try{
    const {admin,user}=await requirePlatformPermission("support.view");
    const body=await request.json();
    const id=String(body?.id||"");

    if(!id)return NextResponse.json({success:false,error:"Ticket id is required."},{status:400});

    const {data:before}=await admin.from("support_tickets")
      .select("id,subject,assigned_to,status").eq("id",id).maybeSingle();

    const payload={updated_at:new Date().toISOString()};
    if(body.assignedTo!==undefined)payload.assigned_to=body.assignedTo||null;
    if(["open","in_progress","waiting_customer","resolved","closed"].includes(body.status)){
      payload.status=body.status;
      if(body.status==="resolved")payload.resolved_at=new Date().toISOString();
    }

    const {data:ticket,error}=await admin.from("support_tickets")
      .update(payload).eq("id",id).select("*").single();
    if(error)throw error;

    // Assigned user gets a targeted notification.
    if(body.assignedTo && body.assignedTo !== before?.assigned_to){
      await admin.from("platform_notifications").insert({
        user_id:body.assignedTo,
        type:"support.ticket.assigned",
        title:"Support ticket assigned to you",
        message:before?.subject || "A client support ticket needs your attention.",
        href:"/admin/support",
        metadata:{ticket_id:id,assigned_by:user.id}
      });
    }

    return NextResponse.json({success:true,ticket});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to update support ticket."},{status});
  }
}
