import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const to = body.to;
    const message =
      body.message || "Hi! This is Phoniq. Your WhatsApp connection is working.";

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "Destination phone number is required.",
        },
        { status: 400 }
      );
    }

    const from = process.env.TELNYX_WHATSAPP_FROM;
    const apiKey = process.env.TELNYX_API_KEY;

    if (!from || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "TELNYX_WHATSAPP_FROM or TELNYX_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    console.log("===== PHONIQ WHATSAPP TEST =====");
    console.log("FROM:", from);
    console.log("TO:", to);
    console.log("MESSAGE:", message);

    const telnyxResponse = await fetch(
      "https://api.telnyx.com/v2/messages/whatsapp",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,

          whatsapp_message: {
            type: "text",

            text: {
              body: message,
              preview_url: false,
            },
          },
        }),
      }
    );

    const result = await telnyxResponse.json();

    console.log(
      "TELNYX WHATSAPP RESPONSE:",
      JSON.stringify(result, null, 2)
    );

    if (!telnyxResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          from,
          to,
          telnyxStatus: telnyxResponse.status,
          telnyxResponse: result,
        },
        { status: telnyxResponse.status }
      );
    }

    return NextResponse.json({
      success: true,

      message: "WhatsApp message submitted to Telnyx.",

      from,
      to,

      telnyxMessageId: result?.data?.id || null,

      recipientStatus:
        result?.data?.to?.[0]?.status || null,

      telnyxResponse: result,
    });
  } catch (error) {
    console.error("WHATSAPP TEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}