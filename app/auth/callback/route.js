import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next =
    requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(next, requestUrl.origin)
      );
    }

    console.error("Supabase callback error:", error);
  }

  return NextResponse.redirect(
    new URL(
      "/forgot-password?error=invalid_recovery_link",
      requestUrl.origin
    )
  );
}