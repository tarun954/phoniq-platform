import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function processPending() {
  const admin = createAdminClient();

  const { data: events, error } = await admin
    .from("automation_events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending:true })
    .limit(20);

  if (error) throw error;

  const processed = [];

  for (const event of events || []) {
    await admin.from("automation_events")
      .update({ status:"processing", attempts:(event.attempts || 0) + 1 })
      .eq("id", event.id);

    try {
      if (event.event_type === "lead.created" && event.resource_type === "lead") {
        const { data: lead, error: leadError } = await admin
          .from("leads")
          .select("*")
          .eq("id", event.resource_id)
          .maybeSingle();

        if (leadError) throw leadError;
        if (!lead) throw new Error("Lead not found.");

        const customerId = lead.customer_id || lead.customerId || null;

        let customer = null;
        if (customerId) {
          const result = await admin.from("customers").select("*").eq("id",customerId).maybeSingle();
          customer = result.data || null;
        }

        const token = crypto.randomBytes(32).toString("hex");

        let booking = null;
        const existing = await admin.from("booking_tokens")
          .select("*").eq("lead_id", lead.id).eq("status","open").maybeSingle();

        if (existing.data) {
          booking = existing.data;
        } else {
          const inserted = await admin.from("booking_tokens").insert({
            organization_id:event.organization_id,
            lead_id:lead.id,
            customer_id:customerId,
            token,
            status:"open",
          }).select("*").single();

          if (inserted.error) throw inserted.error;
          booking = inserted.data;
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const bookingUrl = `${baseUrl}/book/${booking.token}`;

        const email = customer?.email || customer?.email_address || lead.email || lead.customer_email || "";
        const customerName = customer?.name || customer?.full_name || lead.customer_name || "Customer";

        const { data: organization } = await admin.from("organizations")
          .select("name").eq("id",event.organization_id).maybeSingle();

        if (email && process.env.RESEND_API_KEY) {
          const response = await fetch("https://api.resend.com/emails", {
            method:"POST",
            headers:{
              Authorization:`Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type":"application/json",
            },
            body:JSON.stringify({
              from:process.env.PHONIQ_EMAIL_FROM || "Phoniq <onboarding@resend.dev>",
              to:[email],
              subject:`Choose your appointment time with ${organization?.name || "our service team"}`,
              html:`
                <p>Hi ${customerName},</p>
                <p>We received your service request.</p>
                <p><a href="${bookingUrl}">Choose an available appointment time</a></p>
                <p>Powered by Phoniq</p>
              `,
            }),
          });

          if (!response.ok) {
            const details = await response.text();
            console.warn("BOOKING EMAIL:", details);
          }
        }

        await admin.from("automation_events").update({
          status:"completed",
          processed_at:new Date().toISOString(),
          last_error:null,
        }).eq("id",event.id);

        processed.push({ eventId:event.id, bookingUrl });
      } else {
        await admin.from("automation_events").update({
          status:"completed", processed_at:new Date().toISOString()
        }).eq("id",event.id);
      }
    } catch (err) {
      await admin.from("automation_events").update({
        status:"failed",
        processed_at:new Date().toISOString(),
        last_error:err?.message || "Automation failed.",
      }).eq("id",event.id);

      processed.push({ eventId:event.id, error:err?.message });
    }
  }

  return processed;
}

export async function POST(request) {
  const secret = process.env.PHONIQ_AUTOMATION_SECRET;
  if (secret && request.headers.get("x-phoniq-automation-secret") !== secret) {
    return NextResponse.json({ success:false, error:"Unauthorized." }, { status:401 });
  }

  try {
    return NextResponse.json({ success:true, processed:await processPending() });
  } catch (error) {
    return NextResponse.json({ success:false, error:error?.message || "Automation processing failed." }, { status:500 });
  }
}

export async function GET(request) {
  return POST(request);
}
