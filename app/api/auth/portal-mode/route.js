import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(){
  const store=await cookies();
  return NextResponse.json({mode:store.get("phoniq_portal")?.value||null});
}

export async function POST(request){
  const body=await request.json();
  const mode=body?.mode;

  if(!["client","admin"].includes(mode)){
    return NextResponse.json({success:false,error:"Invalid portal mode."},{status:400});
  }

  const response=NextResponse.json({success:true,mode});
  response.cookies.set("phoniq_portal",mode,{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    path:"/",
    maxAge:60*60*12
  });
  return response;
}

export async function DELETE(){
  const response=NextResponse.json({success:true});
  response.cookies.set("phoniq_portal","",{path:"/",maxAge:0});
  return response;
}
