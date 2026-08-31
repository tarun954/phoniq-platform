import crypto from "crypto";
import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

const MAP={
  super_host:{display:"Super Host",role:"super_admin"},
  admin:{display:"Admin",role:"platform_admin"},
  sales:{display:"Sales Employee",role:"sales"},
  support:{display:"Support",role:"support"},
  operations:{display:"Operations",role:"operations"},
  custom:{display:"Custom Role",role:"support"},
};

export async function POST(request){
  try{
    const {admin,user}=await requirePlatformPermission("platform_user.manage");
    const body=await request.json();
    const email=String(body?.email||"").trim().toLowerCase();
    const type=String(body?.roleType||"");
    const config=MAP[type];

    if(!email.includes("@"))return NextResponse.json({success:false,error:"Valid email required."},{status:400});
    if(!config)return NextResponse.json({success:false,error:"Select a valid role."},{status:400});

    const permissionKeys=type==="custom"&&Array.isArray(body?.permissionKeys)?body.permissionKeys:[];
    const token=crypto.randomBytes(32).toString("hex");

    const {data:invite,error}=await admin.from("platform_invitations").insert({
      email,
      display_role:body?.customRoleName?.trim()||config.display,
      platform_role:config.role,
      token,status:"pending",invited_by:user.id,
      permission_keys:permissionKeys,
    }).select("*").single();

    if(error)throw error;

    const baseUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
    const inviteUrl=`${baseUrl}/admin-invite/${token}`;

    let emailSent=false;
    let emailError=null;

    try{
      if(process.env.RESEND_API_KEY){
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{
            Authorization:`Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            from:process.env.PHONIQ_EMAIL_FROM||"Phoniq <onboarding@resend.dev>",
            to:[email],
            subject:"You've been invited to the Phoniq Admin Console",
            html:`<h2>Join the Phoniq internal team</h2><p>You were invited as <strong>${invite.display_role}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`
          })
        });
        emailSent=response.ok;
        if(!response.ok)emailError=await response.text();
      }
    }catch(err){emailError=err?.message||"Email send failed.";}

    return NextResponse.json({success:true,invitation:invite,inviteUrl,emailSent,emailError},{status:201});
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to invite employee."},{status});
  }
}
