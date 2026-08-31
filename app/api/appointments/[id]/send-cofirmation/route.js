import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/crm/auth";

function firstValue(object,keys){
  for(const key of keys){
    if(object&&object[key]!==undefined&&object[key]!==null&&object[key]!=="")return object[key];
  }
  return "";
}

export async function POST(_request,{params}){
  try{
    const {id}=await params;
    const {admin,organizationId}=await requireOrganization();

    const {data:appointment,error:appointmentError}=await admin.from("appointments")
      .select("*").eq("id",id).eq("organization_id",organizationId).maybeSingle();
    if(appointmentError)throw appointmentError;
    if(!appointment)return NextResponse.json({success:false,error:"Appointment not found."},{status:404});

    let customer=null;
    const customerId=firstValue(appointment,["customer_id","customerId"]);
    if(customerId){
      const result=await admin.from("customers").select("*").eq("id",customerId).maybeSingle();
      customer=result.data||null;
    }

    const {data:organization}=await admin.from("organizations").select("*").eq("id",organizationId).maybeSingle();

    let companyProfile=null;
    try{
      const result=await admin.from("company_profiles").select("*").eq("organization_id",organizationId).maybeSingle();
      companyProfile=result.data||null;
    }catch{}

    const customerName=firstValue(customer,["name","full_name","customer_name"])||
      firstValue(appointment,["customer_name","name"])||"Customer";
    const email=firstValue(customer,["email","email_address"])||
      firstValue(appointment,["customer_email","email"]);
    const phone=firstValue(customer,["phone","phone_number","mobile"])||
      firstValue(appointment,["customer_phone","phone"]);
    const companyName=firstValue(companyProfile,["company_name","name"])||
      firstValue(organization,["name"])||"Service Team";
    const appointmentTime=firstValue(appointment,[
      "scheduled_at","appointment_at","start_at","preferred_time","preferredTime"
    ])||"your requested appointment time";

    const results={
      email:{attempted:false,success:false},
      whatsapp:{attempted:false,success:false}
    };

    if(email&&process.env.RESEND_API_KEY){
      results.email.attempted=true;
      try{
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{
            Authorization:`Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            from:process.env.PHONIQ_EMAIL_FROM||"Phoniq <onboarding@resend.dev>",
            to:[email],
            subject:`${companyName} appointment request received`,
            html:`<p>Hi ${customerName},</p><p>Your service appointment with <strong>${companyName}</strong> has been received for <strong>${appointmentTime}</strong>.</p><p>We will contact you if any additional confirmation is required.</p><p>Powered by Phoniq</p>`
          })
        });
        results.email.success=response.ok;
        results.email.response=response.ok?await response.json():await response.text();
      }catch(error){results.email.error=error?.message;}
    }

    if(phone&&process.env.TELNYX_API_KEY&&process.env.TELNYX_WHATSAPP_FROM){
      results.whatsapp.attempted=true;
      try{
        const response=await fetch("https://api.telnyx.com/v2/messages/whatsapp",{
          method:"POST",
          headers:{
            Authorization:`Bearer ${process.env.TELNYX_API_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            from:process.env.TELNYX_WHATSAPP_FROM,
            to:phone,
            whatsapp_message:{
              type:"template",
              template:{
                name:process.env.TELNYX_WHATSAPP_TEMPLATE_NAME||"appointment_confirmation",
                language:{
                  policy:"deterministic",
                  code:process.env.TELNYX_WHATSAPP_TEMPLATE_LANGUAGE||"en_US"
                },
                components:[{
                  type:"body",
                  parameters:[
                    {type:"text",text:String(customerName)},
                    {type:"text",text:String(companyName)},
                    {type:"text",text:String(appointmentTime)}
                  ]
                }]
              }
            }
          })
        });
        results.whatsapp.success=response.ok;
        results.whatsapp.response=response.ok?await response.json():await response.text();
      }catch(error){results.whatsapp.error=error?.message;}
    }

    try{
      const rows=[];
      if(results.email.attempted)rows.push({
        organization_id:organizationId,customer_id:customerId||null,
        channel:"email",direction:"outbound",
        status:results.email.success?"sent":"failed",
        body:`Appointment confirmation for ${appointmentTime}`
      });
      if(results.whatsapp.attempted)rows.push({
        organization_id:organizationId,customer_id:customerId||null,
        channel:"whatsapp",direction:"outbound",
        status:results.whatsapp.success?"sent":"failed",
        body:`Appointment confirmation for ${appointmentTime}`
      });
      if(rows.length)await admin.from("messages").insert(rows);
    }catch(logError){results.logWarning=logError?.message;}

    return NextResponse.json({
      success:results.email.success||results.whatsapp.success,
      customer:{name:customerName,email:email||null,phone:phone||null},
      companyName,appointmentTime,results
    });
  }catch(error){
    const status=Number(error?.status)>=400?Number(error.status):500;
    return NextResponse.json({success:false,error:error?.message||"Unable to send appointment confirmation."},{status});
  }
}
