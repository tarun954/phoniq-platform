import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getAccess() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin =
    createAdminClient();

  const {
    data: membership,
  } = await admin
    .from("organization_members")
    .select(
      "organization_id, role"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  return {
    user,
    admin,
    membership,
  };
}

export async function PATCH(
  request,
  context
) {
  try {
    const access =
      await getAccess();

    if (!access) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const body =
      await request.json();

    const allowedRoles = [
      "owner",
      "admin",
      "dispatcher",
    ];

    if (
      !allowedRoles.includes(
        access.membership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to edit leads",
        },
        {
          status: 403,
        }
      );
    }

    const allowedFields = [
      "status",
      "priority",
      "service_issue",
      "emergency",
      "preferred_time",
      "notes",
      "assigned_to",
      "next_follow_up_at",
      "resolution_notes",
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        updates[field] =
          body[field];
      }
    }

    updates.updated_at =
      new Date().toISOString();

    const {
      data: previousLead,
      error: previousError,
    } = await access.admin
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq(
        "organization_id",
        access.membership
          .organization_id
      )
      .single();

    if (previousError) {
      throw previousError;
    }

    const {
      data: lead,
      error,
    } = await access.admin
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq(
        "organization_id",
        access.membership
          .organization_id
      )
      .is(
        "deleted_at",
        null
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    await access.admin
      .from("lead_activities")
      .insert({
        organization_id:
          access.membership
            .organization_id,

        lead_id: id,

        user_id:
          access.user.id,

        action:
          "lead.updated",

        description:
          "Lead information was updated",

        old_value:
          previousLead,

        new_value:
          lead,
      });

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error(
      "UPDATE LEAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update lead",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request,
  context
) {
  try {
    const access =
      await getAccess();

    if (!access) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      ![
        "owner",
        "admin",
      ].includes(
        access.membership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only owners and admins can delete leads",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const deletedAt =
      new Date().toISOString();

    const {
      data,
      error,
    } = await access.admin
      .from("leads")
      .update({
        deleted_at:
          deletedAt,

        deleted_by:
          access.user.id,
      })
      .eq("id", id)
      .eq(
        "organization_id",
        access.membership
          .organization_id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    await access.admin
      .from("lead_activities")
      .insert({
        organization_id:
          access.membership
            .organization_id,

        lead_id:
          id,

        user_id:
          access.user.id,

        action:
          "lead.deleted",

        description:
          "Lead moved to trash",
      });

    return NextResponse.json({
      success: true,
      lead: data,
    });
  } catch (error) {
    console.error(
      "DELETE LEAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete lead",
      },
      {
        status: 500,
      }
    );
  }
}
export async function GET(
    request,
    context
  ) {
    try {
      const access = await getAccess();
  
      if (!access) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const { id } = await context.params;
  
      const { data: lead, error } =
        await access.admin
          .from("leads")
          .select(`
            *,
            customer:customers(
              id,
              full_name,
              phone,
              service_address,
              city
            ),
            call:calls(
              id,
              caller_phone,
              called_phone,
              summary,
              created_at
            ),
            appointment:appointments(
              id,
              status,
              notes,
              created_at
            )
          `)
          .eq("id", id)
          .eq(
            "organization_id",
            access.membership.organization_id
          )
          .maybeSingle();
  
      if (error) {
        throw error;
      }
  
      if (!lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }
  
      const {
        data: activities,
        error: activityError,
      } = await access.admin
        .from("lead_activities")
        .select("*")
        .eq("lead_id", id)
        .eq(
          "organization_id",
          access.membership.organization_id
        )
        .order("created_at", {
          ascending: false,
        });
  
      if (activityError) {
        throw activityError;
      }
  
      return NextResponse.json({
        success: true,
        lead,
        activities: activities || [],
        role: access.membership.role,
      });
    } catch (error) {
      console.error(
        "GET LEAD ERROR:",
        error
      );
  
      return NextResponse.json(
        {
          error: "Unable to load lead",
        },
        {
          status: 500,
        }
      );
    }
  }