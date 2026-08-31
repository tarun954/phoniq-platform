import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/crm/auth";

export async function POST(request){
  try{
    const {admin,organizationId}=await requireOrganization();
    const body=await request.json();
    const planKey=["starter","growth","pro"].includes(body?.planKey)?body.planKey:"starter";
    const amountMap={starter:9900,growth:19900,pro:34900};

    const now=new Date();
    const periodEnd=new Date(now.getTime()+30*24*60*60*1000);

    const {data,error}=await admin.from("subscriptions").upsert({
      organization_id:organizationId,
      provider:"mock",
      plan_key:planKey,
      status:"active",
      amount_cents:amountMap[planKey],
      currency:"usd",
      current_period_start:now.toISOString(),
      current_period_end:periodEnd.toISOString(),
      updated_at:now.toISOString()
    },{onConflict:"organization_id"}).select("*").single();

    if(error)throw error;
    return NextResponse.json({success:true,testMode:true,subscription:data});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Mock payment failed."},{status});
  }
}
