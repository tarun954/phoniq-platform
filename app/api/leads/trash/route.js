import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // 1. Get logged-in user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Use admin client for secure server-side DB queries
    const admin = createAdminClient();

    // 3. Find which organization/company this user belongs to
    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization membership not found",
        },
        {
          status: 403,
        }
      );
    }

    // 4. Load ONLY deleted leads for this user's company
    const {
      data: leads,
      error: leadsError,
    } = await admin
      .from("leads")
      .select(`
        *,
        customer:customers(
          id,
          full_name,
          phone,
          city,
          service_address
        )
      `)
      .eq(
        "organization_id",
        membership.organization_id
      )
      .not("deleted_at", "is", null)
      .order("deleted_at", {
        ascending: false,
      });

    if (leadsError) {
      throw leadsError;
    }

    // 5. Return deleted leads
    return NextResponse.json({
      success: true,
      role: membership.role,
      leads: leads || [],
    });
  } catch (error) {
    console.error(
      "GET TRASH LEADS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load deleted leads",
      },
      {
        status: 500,
      }
    );
  }
}