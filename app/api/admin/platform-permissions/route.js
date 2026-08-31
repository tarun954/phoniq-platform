import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

export async function GET(){
  try{
    const {admin}=await requirePlatformPermission("platform_user.view");
    const {data,error}=await admin.from("platform_permissions")
      .select("id,permission_key,name,description,category")
      .order("category").order("permission_key");
    if(error)throw error;
    return NextResponse.json({success:true,permissions:data||[]});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to load permissions."},{status});
  }
}
