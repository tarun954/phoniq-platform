import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request,
  context
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: membership,
    } = await admin
      .from(
        "organization_members"
      )
      .select(
        "organization_id, role"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (
      !membership ||
      ![
        "owner",
        "admin",
      ].includes(
        membership.role
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const {
      data,
      error,
    } = await admin
      .from("leads")
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", id)
      .eq(
        "organization_id",
        membership.organization_id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    await admin
      .from("lead_activities")
      .insert({
        organization_id:
          membership.organization_id,

        lead_id: id,

        user_id:
          user.id,

        action:
          "lead.restored",

        description:
          "Lead restored from trash",
      });

    return NextResponse.json({
      success: true,
      lead: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to restore lead",
      },
      {
        status: 500,
      }
    );
  }
}