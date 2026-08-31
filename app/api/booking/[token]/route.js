import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAppointmentConfirmation } from "@/lib/communications/sendAppointmentConfirmation";

function combineDateTime(dateString,timeString) {
  return new Date(`${dateString}T${String(timeString).slice(0,5)}:00`);
}

function formatSlot(date) {
  return date.toISOString();
}

export async function GET(_request,{params}) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: booking, error } = await admin.from("booking_tokens")
      .select("*").eq("token",token).maybeSingle();

    if (error) throw error;
    if (!booking) return NextResponse.json({success:false,error:"Booking link not found."},{status:404});
    if (booking.status !== "open") return NextResponse.json({success:false,error:`Booking link is ${booking.status}.`},{status:409});
    if (new Date(booking.expires_at).getTime() < Date.now()) return NextResponse.json({success:false,error:"Booking link expired."},{status:410});

    const [{data:availability},{data:organization},{data:customer}] = await Promise.all([
      admin.from("company_availability").select("*").eq("organization_id",booking.organization_id),
      admin.from("organizations").select("id,name").eq("id",booking.organization_id).maybeSingle(),
      booking.customer_id
        ? admin.from("customers").select("*").eq("id",booking.customer_id).maybeSingle()
        : Promise.resolve({data:null}),
    ]);

    const now = new Date();
    const slots = [];

    for (let offset=0; offset<14; offset++) {
      const day = new Date(now);
      day.setDate(now.getDate()+offset);
      const weekday = day.getDay();
      const rule = (availability || []).find(item => Number(item.weekday) === weekday && item.enabled);
      if (!rule) continue;

      const dateString = day.toISOString().slice(0,10);
      let cursor = combineDateTime(dateString,rule.start_time);
      const end = combineDateTime(dateString,rule.end_time);
      const step = (Number(rule.slot_minutes) || 60) * 60000;

      while (cursor.getTime() + step <= end.getTime()) {
        if (cursor.getTime() > Date.now() + 60*60000) slots.push(formatSlot(cursor));
        cursor = new Date(cursor.getTime()+step);
      }
    }

    const windowStart = new Date().toISOString();
    const windowEnd = new Date(Date.now()+15*24*60*60*1000).toISOString();
    const {data:appointments} = await admin.from("appointments")
      .select("scheduled_at")
      .eq("organization_id",booking.organization_id)
      .gte("scheduled_at",windowStart)
      .lte("scheduled_at",windowEnd);

    const occupied = new Set((appointments || []).map(a => a.scheduled_at).filter(Boolean));

    return NextResponse.json({
      success:true,
      booking:{
        companyName:organization?.name || "Service Company",
        customerName:customer?.name || customer?.full_name || "Customer",
        expiresAt:booking.expires_at,
      },
      slots:slots.filter(slot => !occupied.has(slot)).slice(0,40),
    });
  } catch (error) {
    return NextResponse.json({success:false,error:error?.message || "Unable to load booking."},{status:500});
  }
}

export async function POST(request,{params}) {
  try {
    const { token } = await params;
    const body = await request.json();
    const requested = new Date(body?.scheduledAt);

    if (Number.isNaN(requested.getTime())) {
      return NextResponse.json({success:false,error:"Choose a valid appointment time."},{status:400});
    }

    const admin = createAdminClient();

    const {data:booking,error}=await admin.from("booking_tokens")
      .select("*").eq("token",token).maybeSingle();

    if(error)throw error;
    if(!booking)return NextResponse.json({success:false,error:"Booking link not found."},{status:404});
    if(booking.status!=="open")return NextResponse.json({success:false,error:`Booking link is ${booking.status}.`},{status:409});

    // Revalidate that the chosen slot is part of company availability.
    const weekday=requested.getDay();
    const {data:rule}=await admin.from("company_availability")
      .select("*").eq("organization_id",booking.organization_id)
      .eq("weekday",weekday).eq("enabled",true).maybeSingle();

    if(!rule)return NextResponse.json({success:false,error:"That day is not available."},{status:409});

    const hhmm=requested.toTimeString().slice(0,5);
    if(hhmm < String(rule.start_time).slice(0,5) || hhmm >= String(rule.end_time).slice(0,5)) {
      return NextResponse.json({success:false,error:"That time is outside company availability."},{status:409});
    }

    const {data:conflict}=await admin.from("appointments")
      .select("id").eq("organization_id",booking.organization_id)
      .eq("scheduled_at",requested.toISOString()).limit(1);

    if(conflict?.length)return NextResponse.json({success:false,error:"That slot was just booked. Choose another."},{status:409});

    let appointment=null;

    if(booking.lead_id){
      const existing=await admin.from("appointments")
        .select("*").eq("organization_id",booking.organization_id)
        .eq("lead_id",booking.lead_id).limit(1);

      if(existing.data?.length){
        const updated=await admin.from("appointments").update({
          scheduled_at:requested.toISOString(),
          booking_status:"confirmed",
          booking_token_id:booking.id,
          customer_id:booking.customer_id || existing.data[0].customer_id || null,
        }).eq("id",existing.data[0].id).select("*").single();

        if(updated.error)throw updated.error;
        appointment=updated.data;
      }
    }

    if(!appointment){
      const inserted=await admin.from("appointments").insert({
        organization_id:booking.organization_id,
        lead_id:booking.lead_id,
        customer_id:booking.customer_id,
        scheduled_at:requested.toISOString(),
        booking_status:"confirmed",
        booking_token_id:booking.id,
      }).select("*").single();

      if(inserted.error)throw inserted.error;
      appointment=inserted.data;
    }

    await admin.from("booking_tokens").update({
      status:"booked",
      booked_appointment_id:appointment.id,
    }).eq("id",booking.id);

    const [{data:customer},{data:organization}] = await Promise.all([
      booking.customer_id
        ? admin.from("customers").select("*").eq("id",booking.customer_id).maybeSingle()
        : Promise.resolve({data:null}),
      admin.from("organizations").select("name").eq("id",booking.organization_id).maybeSingle(),
    ]);

    const customerName=customer?.name || customer?.full_name || "Customer";
    const email=customer?.email || customer?.email_address || "";
    const phone=customer?.phone || customer?.phone_number || customer?.mobile || "";
    const companyName=organization?.name || "Service Company";
    const appointmentTime=requested.toLocaleString("en-US");

    const communications=await sendAppointmentConfirmation({
      customerName,email,phone,companyName,appointmentTime
    });

    await admin.from("client_realtime_notifications").insert({
      organization_id:booking.organization_id,
      type:"appointment.booked",
      title:"Appointment booked",
      message:`${customerName} selected ${appointmentTime}.`,
      href:"/appointments",
      metadata:{appointment_id:appointment.id,lead_id:booking.lead_id}
    });

    return NextResponse.json({
      success:true,
      appointment,
      communications,
    });
  } catch (error) {
    return NextResponse.json({success:false,error:error?.message || "Unable to book appointment."},{status:500});
  }
}
