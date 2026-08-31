// import { NextResponse } from "next/server";
// export { GET, dynamic } from "@/app/api/integrations/whatsapp/status/route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalize(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g,"");
  return digits ? `+${digits}` : "";
}

export async function GET() {
  const apiKey = process.env.TELNYX_API_KEY;
  const configuredFrom = normalize(process.env.TELNYX_WHATSAPP_FROM);

  if (!apiKey) {
    return NextResponse.json({
      success:false,
      error:"TELNYX_API_KEY is missing."
    },{status:500});
  }

  try {
    const response = await fetch("https://api.telnyx.com/v2/whatsapp/phone_numbers",{
      headers:{ Authorization:`Bearer ${apiKey}` },
      cache:"no-store"
    });

    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; }
    catch { body = { raw:text }; }

    if (!response.ok) {
      return NextResponse.json({
        success:false,
        telnyxStatus:response.status,
        configuredFrom,
        telnyxResponse:body
      },{status:502});
    }

    const numbers = Array.isArray(body?.data) ? body.data : [];

    const normalized = numbers.map(item => ({
      phone_number:normalize(item.phone_number),
      phone_number_id:item.phone_number_id,
      waba_id:item.waba_id,
      display_name:item.display_name,
      quality_rating:item.quality_rating,
      status:item.status,
      enabled:item.enabled,
      calling_enabled:item.calling_enabled
    }));

    const match = normalized.find(item => item.phone_number === configuredFrom) || null;

    return NextResponse.json({
      success:true,
      configuredFrom,
      configuredNumberFound:Boolean(match),
      configuredNumber:match,
      registeredNumbers:normalized,
      template:{
        idPresent:Boolean(process.env.TELNYX_WHATSAPP_TEMPLATE_ID),
        name:process.env.TELNYX_WHATSAPP_TEMPLATE_NAME || "appointment_confirmation",
        language:process.env.TELNYX_WHATSAPP_TEMPLATE_LANGUAGE || "en_US"
      },
      nextStep:match
        ? "The API key can see the configured WhatsApp sender. If sending still returns Invalid source number, capture this JSON plus the failed request timestamp and contact Telnyx support."
        : "The API key cannot see TELNYX_WHATSAPP_FROM in GET /v2/whatsapp/phone_numbers. Verify the API key belongs to the same Telnyx account as this WABA/phone number."
    });
  } catch (error) {
    return NextResponse.json({
      success:false,
      configuredFrom,
      error:error?.message || "Unable to query Telnyx WhatsApp numbers."
    },{status:500});
  }
}
