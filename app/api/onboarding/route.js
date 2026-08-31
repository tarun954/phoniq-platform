import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const admin = createAdminClient();

    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No organization membership exists for this account yet. Keep your existing signup organization-creation step, or create the organization before onboarding.",
        },
        { status: 409 }
      );
    }

    const organizationId = membership.organization_id;

    const payload = {
      organization_id: organizationId,
      company_name: String(body.companyName || "").trim(),
      business_type: String(body.businessType || "").trim(),
      website: String(body.website || "").trim(),
      main_phone: String(body.mainPhone || "").trim(),
      service_area: String(body.serviceArea || "").trim(),
      timezone: String(body.timezone || "America/Chicago"),
      team_size: String(body.teamSize || ""),
      primary_contact_name: String(body.primaryContactName || "").trim(),
      primary_contact_phone: String(body.primaryContactPhone || "").trim(),
      notification_email: String(body.notificationEmail || "").trim(),
      services: Array.isArray(body.services) ? body.services : [],
      emergency_policy: String(body.emergencyPolicy || "").trim(),
      ai_agent_name: String(body.aiAgentName || "Phoniq AI").trim(),
      ai_greeting: String(body.aiGreeting || "").trim(),
      whatsapp_enabled: Boolean(body.whatsappEnabled),
      business_hours: body.businessHours || {},
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.company_name) {
      return NextResponse.json(
        { success: false, error: "Company name is required." },
        { status: 400 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("company_profiles")
      .upsert(payload, {
        onConflict: "organization_id",
      })
      .select()
      .single();

    if (profileError) throw profileError;

    const {
      data: existingWidget,
      error: widgetLookupError,
    } = await admin
      .from("chat_widgets")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (widgetLookupError) throw widgetLookupError;

    let widget = existingWidget;

    if (!widget) {
      const {
        data: createdWidget,
        error: createWidgetError,
      } = await admin
        .from("chat_widgets")
        .insert({
          organization_id: organizationId,
          display_name: `${payload.company_name} Assistant`,
          greeting:
            "Hi! Tell us what service you need and Phoniq will help get your request to the team.",
        })
        .select()
        .single();

      if (createWidgetError) throw createWidgetError;

      widget = createdWidget;
    }

    return NextResponse.json({
      success: true,
      profile,
      widget: {
        id: widget.id,
        publicKey: widget.public_key,
      },
    });
  } catch (error) {
    console.error("PHONIQ ONBOARDING ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save company onboarding.",
      },
      { status: 500 }
    );
  }
}
