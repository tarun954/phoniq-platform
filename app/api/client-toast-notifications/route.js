import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/crm/auth";

export async function GET(){
  try{
    const {admin,organizationId}=await requireOrganization();

    const {data,error}=await admin
      .from("client_realtime_notifications")
      .select("*")
      .eq("organization_id",organizationId)
      .order("created_at",{ascending:false})
      .limit(20);

    if(error)throw error;

    return NextResponse.json({success:true,notifications:data||[]});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load popup notifications."},{status});
  }
}

export async function PATCH(request){
  try{
    const {admin,organizationId}=await requireOrganization();
    const body=await request.json();

    let query=admin.from("client_realtime_notifications")
      .update({read:true})
      .eq("organization_id",organizationId);

    if(body?.id)query=query.eq("id",body.id);
    else query=query.eq("read",false);

    const {error}=await query;
    if(error)throw error;

    return NextResponse.json({success:true});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to update popup."},{status});
  }
}
