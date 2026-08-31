import { NextResponse } from "next/server";
import { getWhatsAppDiagnostics } from "@/lib/communications/telnyx-whatsapp-diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getWhatsAppDiagnostics();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to run Telnyx WhatsApp diagnostics.",
      },
      { status: 500 }
    );
  }
}
