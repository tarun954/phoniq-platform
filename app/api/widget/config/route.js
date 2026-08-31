import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: cors(origin),
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Missing widget key" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: widget, error } = await admin
      .from("chat_widgets")
      .select("public_key, display_name, greeting, accent_color, allowed_domains, enabled")
      .eq("public_key", key)
      .maybeSingle();

    if (error) throw error;

    if (!widget || !widget.enabled) {
      return NextResponse.json(
        { success: false, error: "Widget not found or disabled" },
        { status: 404 }
      );
    }

    const origin = request.headers.get("origin");
    const allowed = Array.isArray(widget.allowed_domains)
      ? widget.allowed_domains
      : [];

    if (origin && allowed.length > 0) {
      const hostname = new URL(origin).hostname;

      if (!allowed.includes(hostname)) {
        return NextResponse.json(
          { success: false, error: "Domain not allowed" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        widget: {
          displayName: widget.display_name,
          greeting: widget.greeting,
          accentColor: widget.accent_color,
        },
      },
      {
        headers: cors(origin),
      }
    );
  } catch (error) {
    console.error("WIDGET CONFIG ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load widget configuration" },
      { status: 500 }
    );
  }
}
